#!/usr/bin/env python3
"""
Smooth Concrete Calculator - Process Supervisor & Health Monitor
Prevents infinite loops, handles graceful restarts, monitors server health.
"""

import os
import sys
import time
import json
import signal
import subprocess
import requests
from pathlib import Path
from datetime import datetime, timedelta
from collections import deque
import logging

# Setup logging
LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / "supervisor.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuration
CONFIG = {
    "port": 8001,
    "host": "0.0.0.0",
    "health_check_interval": 10,  # seconds
    "health_check_timeout": 5,    # seconds
    "max_consecutive_failures": 5,  # before escalation
    "max_restart_attempts": 3,    # per 5-minute window
    "restart_cooldown": 30,       # seconds between restarts
    "startup_timeout": 15,        # seconds to reach healthy state
}

class ProcessSupervisor:
    """Manages server process with health monitoring and restart logic."""
    
    def __init__(self):
        self.process = None
        self.start_time = None
        self.consecutive_failures = 0
        self.restart_history = deque(maxlen=20)  # Last 20 restarts
        self.health_history = deque(maxlen=100)  # Last 100 health checks
        self.last_restart_time = None
        self.monitoring = False
        
    def start(self):
        """Start the FastAPI server."""
        if self.process and self.process.poll() is None:
            logger.warning("Process already running (PID: %s). Skipping start.", self.process.pid)
            return
        
        logger.info("Starting Smooth Concrete Calculator server...")
        
        try:
            # Activate venv and start uvicorn
            venv_python = Path(__file__).parent / "venv" / "bin" / "python3"
            if not venv_python.exists():
                raise FileNotFoundError(f"Virtual environment not found at {venv_python}")
            
            cmd = [
                str(venv_python),
                "-m", "uvicorn",
                "backend.main:app",
                "--host", CONFIG["host"],
                "--port", str(CONFIG["port"]),
                "--log-level", "info"
            ]
            
            self.process = subprocess.Popen(
                cmd,
                cwd=str(Path(__file__).parent),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            self.start_time = datetime.now()
            self.restart_history.append({
                "timestamp": self.start_time.isoformat(),
                "pid": self.process.pid,
                "status": "started"
            })
            
            logger.info("✅ Process started (PID: %s). Waiting for startup...", self.process.pid)
            
            # Wait for server to become healthy
            if not self._wait_for_health(CONFIG["startup_timeout"]):
                logger.error("❌ Server failed to become healthy within %ds. Escalating.", CONFIG["startup_timeout"])
                self._escalate_failure()
                return False
            
            logger.info("✅ Server is healthy. Ready for requests.")
            self.consecutive_failures = 0
            return True
            
        except Exception as e:
            logger.error("❌ Failed to start process: %s", str(e))
            self._escalate_failure()
            return False
    
    def _wait_for_health(self, timeout_seconds):
        """Wait for server to report healthy status."""
        start = time.time()
        while time.time() - start < timeout_seconds:
            try:
                resp = requests.get(
                    f"http://{CONFIG['host']}:{CONFIG['port']}/health",
                    timeout=CONFIG["health_check_timeout"]
                )
                if resp.status_code == 200:
                    logger.info("✅ Health check passed: %s", resp.text)
                    return True
            except requests.exceptions.RequestException:
                pass  # Server not ready yet
            
            time.sleep(1)
        
        return False
    
    def check_health(self):
        """Perform a single health check."""
        timestamp = datetime.now()
        
        # Check if process is still running
        if self.process is None or self.process.poll() is not None:
            logger.error("❌ Process is not running (exited with code %s)", 
                        self.process.returncode if self.process else "N/A")
            self.health_history.append({
                "timestamp": timestamp.isoformat(),
                "status": "process_dead",
                "consequence": "will_restart"
            })
            self._handle_process_failure()
            return False
        
        # Check HTTP health endpoint
        try:
            resp = requests.get(
                f"http://{CONFIG['host']}:{CONFIG['port']}/health",
                timeout=CONFIG["health_check_timeout"]
            )
            
            if resp.status_code == 200:
                self.health_history.append({
                    "timestamp": timestamp.isoformat(),
                    "status": "healthy",
                    "response": resp.text[:100]
                })
                self.consecutive_failures = 0
                logger.debug("✅ Health check OK")
                return True
            else:
                logger.warning("⚠️ Health check returned status %s", resp.status_code)
                
        except requests.exceptions.Timeout:
            logger.warning("⚠️ Health check timeout (server not responding in %ds)", 
                          CONFIG["health_check_timeout"])
        except requests.exceptions.ConnectionError:
            logger.warning("⚠️ Health check failed (cannot connect)")
        except Exception as e:
            logger.warning("⚠️ Health check error: %s", str(e))
        
        self.consecutive_failures += 1
        self.health_history.append({
            "timestamp": timestamp.isoformat(),
            "status": "unhealthy",
            "consecutive_failures": self.consecutive_failures
        })
        
        if self.consecutive_failures >= CONFIG["max_consecutive_failures"]:
            logger.error("❌ Consecutive failures reached threshold (%d). Restarting...", 
                        self.consecutive_failures)
            self._handle_process_failure()
        
        return False
    
    def _handle_process_failure(self):
        """Handle a process failure with intelligent restart logic."""
        
        # Check if we've restarted too many times recently
        recent_restarts = [
            r for r in self.restart_history
            if datetime.fromisoformat(r["timestamp"]) > datetime.now() - timedelta(minutes=5)
        ]
        
        if len(recent_restarts) >= CONFIG["max_restart_attempts"]:
            logger.critical("⚠️ LOOP PROTECTION: Too many restarts in 5 minutes (%d). HALTING.", 
                           len(recent_restarts))
            logger.critical("Recent restart times: %s", 
                           [r["timestamp"] for r in recent_restarts])
            logger.critical("Manual intervention required. Check logs for root cause.")
            self.monitoring = False
            return
        
        # Exponential backoff before restart
        backoff = min(30, 5 * (2 ** len(recent_restarts)))
        logger.info("⏳ Waiting %ds before restart (attempt %d of %d)...", 
                   backoff, len(recent_restarts) + 1, CONFIG["max_restart_attempts"])
        time.sleep(backoff)
        
        # Restart the process
        logger.info("🔄 Attempting restart...")
        self.stop()
        time.sleep(2)
        self.start()
    
    def _escalate_failure(self):
        """Escalate a startup failure."""
        self.consecutive_failures += 1
        logger.critical("⚠️ Escalation level %d. Check logs for details.", 
                       self.consecutive_failures)
    
    def stop(self):
        """Stop the process gracefully."""
        if self.process is None or self.process.poll() is not None:
            logger.info("Process already stopped.")
            return
        
        logger.info("Stopping process (PID: %s)...", self.process.pid)
        try:
            self.process.terminate()
            self.process.wait(timeout=5)
            logger.info("✅ Process stopped gracefully.")
        except subprocess.TimeoutExpired:
            logger.warning("⚠️ Process didn't stop within 5s. Force killing...")
            self.process.kill()
            self.process.wait()
            logger.info("✅ Process force-killed.")
    
    def monitor(self):
        """Continuously monitor health and restart if needed."""
        logger.info("=" * 60)
        logger.info("Starting Supervisor Loop")
        logger.info("=" * 60)
        
        self.monitoring = True
        self.start()
        
        try:
            while self.monitoring:
                time.sleep(CONFIG["health_check_interval"])
                self.check_health()
                
        except KeyboardInterrupt:
            logger.info("Received interrupt. Shutting down...")
            self.stop()
        except Exception as e:
            logger.error("Unexpected error in monitor loop: %s", str(e))
            self.stop()
    
    def get_status(self):
        """Return current status as JSON."""
        return {
            "timestamp": datetime.now().isoformat(),
            "process_running": self.process is not None and self.process.poll() is None,
            "pid": self.process.pid if self.process else None,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "uptime_seconds": (datetime.now() - self.start_time).total_seconds() if self.start_time else 0,
            "consecutive_failures": self.consecutive_failures,
            "restart_count": len(self.restart_history),
            "recent_health": list(self.health_history)[-5:],
            "recent_restarts": list(self.restart_history)[-5:]
        }
    
    def save_status(self):
        """Save status to JSON file for external monitoring."""
        status_file = LOG_DIR / "supervisor_status.json"
        try:
            with open(status_file, "w") as f:
                json.dump(self.get_status(), f, indent=2)
        except Exception as e:
            logger.error("Failed to save status: %s", str(e))


def signal_handler(supervisor):
    """Handle SIGTERM gracefully."""
    def handler(signum, frame):
        logger.info("Received SIGTERM. Shutting down...")
        supervisor.monitoring = False
        supervisor.stop()
        sys.exit(0)
    return handler


if __name__ == "__main__":
    supervisor = ProcessSupervisor()
    
    # Setup signal handlers
    signal.signal(signal.SIGTERM, signal_handler(supervisor))
    signal.signal(signal.SIGINT, signal_handler(supervisor))
    
    # Start monitoring
    try:
        supervisor.monitor()
    except Exception as e:
        logger.error("Fatal error: %s", str(e))
        supervisor.stop()
        sys.exit(1)
