#!/usr/bin/env python3
"""
Smooth Concrete Calculator - Status Dashboard
Displays current health, restart history, and potential issues.
Auto-refreshes every 10 seconds. Press Ctrl+C to exit.
"""

import json
import subprocess
import sys
import time
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict

CALC_DIR = Path(__file__).parent
STATUS_FILE = CALC_DIR / "logs" / "supervisor_status.json"
SUPERVISOR_LOG = CALC_DIR / "logs" / "supervisor.log"


def clear_screen():
    """Clear terminal screen."""
    os.system("clear" if sys.platform != "win32" else "cls")


def get_status():
    """Load the latest status from JSON file."""
    if not STATUS_FILE.exists():
        return None
    try:
        with open(STATUS_FILE, "r") as f:
            return json.load(f)
    except:
        return None


def get_log_tail(lines=20):
    """Get last N lines of supervisor log."""
    if not SUPERVISOR_LOG.exists():
        return []
    try:
        with open(SUPERVISOR_LOG, "r") as f:
            log_lines = f.readlines()
        return log_lines[-lines:]
    except:
        return []


def format_duration(seconds):
    """Format seconds as human-readable duration."""
    if seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        return f"{int(seconds // 60)}m"
    else:
        hours = seconds / 3600
        return f"{hours:.1f}h"


def check_for_issues(status):
    """Analyze status and return list of potential issues."""
    issues = []
    
    if not status:
        return ["❌ No status available - supervisor may not be running"]
    
    # Check process status
    if not status.get("process_running"):
        issues.append("⚠️  Process is NOT running")
    
    # Check consecutive failures
    consecutive_failures = status.get("consecutive_failures", 0)
    if consecutive_failures >= 5:
        issues.append(f"🔴 CRITICAL: {consecutive_failures} consecutive failures - check logs!")
    elif consecutive_failures >= 2:
        issues.append(f"⚠️  {consecutive_failures} consecutive failures")
    
    # Check restart frequency
    recent_restarts = len(status.get("recent_restarts", []))
    if recent_restarts >= 3:
        issues.append(f"⚠️  Server restarted {recent_restarts} times recently - may indicate loop")
    
    # Check uptime (very low = repeated crashes)
    uptime = status.get("uptime_seconds", 0)
    if 0 < uptime < 30:
        issues.append(f"⚠️  Very low uptime ({format_duration(uptime)}) - check startup errors")
    
    return issues


def display_dashboard():
    """Display the status dashboard."""
    while True:
        os.system("clear")
        
        status = get_status()
        issues = check_for_issues(status)
        
        print("╔" + "═" * 78 + "╗")
        print("║" + " " * 20 + "SMOOTH CONCRETE CALCULATOR - STATUS DASHBOARD" + " " * 14 + "║")
        print("╚" + "═" * 78 + "╝")
        print()
        
        if not status:
            print("⏳ Waiting for supervisor status...")
            print(f"   Status file: {STATUS_FILE}")
            print(f"   Log file:    {SUPERVISOR_LOG}")
            time.sleep(5)
            continue
        
        # Process Status
        print("📊 PROCESS STATUS")
        print("─" * 80)
        running = status.get("process_running", False)
        status_icon = "✅" if running else "❌"
        print(f"  {status_icon} Status:              {('RUNNING' if running else 'STOPPED'):20} PID: {status.get('pid', 'N/A')}")
        print(f"  ⏱️  Uptime:              {format_duration(status.get('uptime_seconds', 0)):20}")
        print(f"  🚀 Failures (consecutive): {status.get('consecutive_failures', 0)}")
        print(f"  🔄 Total Restarts:       {status.get('restart_count', 0)}")
        print()
        
        # Health Checks
        print("❤️  RECENT HEALTH CHECKS (Last 5)")
        print("─" * 80)
        for check in status.get("recent_health", [])[-5:]:
            ts = check.get("timestamp", "?")
            check_status = check.get("status", "unknown")
            icon = "✅" if check_status == "healthy" else "⚠️ "
            print(f"  {icon} [{ts.split('T')[1][:8]}] {check_status:20} {check.get('consecutive_failures', '')}")
        print()
        
        # Restarts
        print("🔄 RECENT RESTARTS (Last 5)")
        print("─" * 80)
        for restart in status.get("recent_restarts", [])[-5:]:
            ts = restart.get("timestamp", "?")
            pid = restart.get("pid", "?")
            print(f"  [{ts.split('T')[1][:8]}] PID {pid:8} - {restart.get('status', 'started')}")
        print()
        
        # Issues
        print("⚠️  ISSUES & ALERTS")
        print("─" * 80)
        if issues:
            for issue in issues:
                print(f"  {issue}")
        else:
            print(f"  ✅ No issues detected")
        print()
        
        # Recent Logs
        print("📝 RECENT LOG ENTRIES (Last 5)")
        print("─" * 80)
        for line in get_log_tail(5):
            line = line.strip()
            if line:
                print(f"  {line[:76]}")
        print()
        
        # Quick Actions
        print("📋 QUICK ACTIONS")
        print("─" * 80)
        print("  Restart:     pkill -f supervisor.py && sleep 2 && ./start.sh")
        print("  View Full Log: tail -f logs/supervisor.log")
        print("  Check Port:  lsof -i :8001")
        print("  Test Health: curl http://localhost:8001/health")
        print()
        
        print(f"⏰ Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} (refreshes every 10s)")
        print("Press Ctrl+C to exit")
        
        time.sleep(10)


if __name__ == "__main__":
    import os
    try:
        display_dashboard()
    except KeyboardInterrupt:
        print("\n\nGoodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
