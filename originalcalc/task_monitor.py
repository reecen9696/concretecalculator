#!/usr/bin/env python3
"""
Smooth Concrete Calculator - Task Monitor & Loop Detector
Watches for patterns that indicate infinite loops or stuck tasks.
Flags issues automatically and prevents recursive work.
"""

import json
import time
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from collections import deque
import logging

logger = logging.getLogger(__name__)

class TaskMonitor:
    """Monitors task execution to detect and prevent infinite loops."""
    
    def __init__(self):
        self.task_history = deque(maxlen=100)
        self.tool_calls = deque(maxlen=50)
        self.flags = []
        self.max_iterations = 20
        self.max_same_tool_calls = 3
        self.iteration_timeout = 300  # 5 minutes
        
    def log_tool_call(self, tool_name, params=None, result_summary=None):
        """Log a tool call for loop detection."""
        call = {
            "timestamp": datetime.now().isoformat(),
            "tool": tool_name,
            "params": params,
            "result": result_summary
        }
        self.tool_calls.append(call)
        
        # Check for loop patterns
        self._check_for_loops()
    
    def _check_for_loops(self):
        """Analyze recent tool calls for loop patterns."""
        if len(self.tool_calls) < 3:
            return
        
        recent = list(self.tool_calls)[-10:]
        
        # Pattern 1: Same tool called 3+ times in a row
        consecutive_same = 1
        last_tool = recent[0]["tool"]
        for call in recent[1:]:
            if call["tool"] == last_tool:
                consecutive_same += 1
                if consecutive_same >= self.max_same_tool_calls:
                    self._flag_issue(
                        severity="high",
                        issue=f"Same tool called {consecutive_same}x in a row: {last_tool}",
                        recommendation="Stop and analyze why this tool is being called repeatedly"
                    )
                    break
            else:
                consecutive_same = 1
                last_tool = call["tool"]
        
        # Pattern 2: Repetitive tool sequence (A→B→A→B→A)
        if len(recent) >= 4:
            if (recent[-1]["tool"] == recent[-3]["tool"] and
                recent[-2]["tool"] == recent[-4]["tool"] and
                recent[-1]["tool"] != recent[-2]["tool"]):
                self._flag_issue(
                    severity="high",
                    issue=f"Alternating tool pattern detected: {recent[-4]['tool']} ↔ {recent[-3]['tool']}",
                    recommendation="This typically indicates a circular dependency or missed exit condition"
                )
        
        # Pattern 3: Too many total tool calls
        if len(self.tool_calls) >= self.max_iterations:
            self._flag_issue(
                severity="critical",
                issue=f"Task exceeded {self.max_iterations} tool calls",
                recommendation="STOP IMMEDIATELY. Too many iterations indicates infinite loop. Check last 5 calls for repetition pattern."
            )
    
    def _flag_issue(self, severity, issue, recommendation):
        """Add a flag for potential issue."""
        flag = {
            "timestamp": datetime.now().isoformat(),
            "severity": severity,  # low, medium, high, critical
            "issue": issue,
            "recommendation": recommendation,
            "recent_calls": [c["tool"] for c in list(self.tool_calls)[-5:]]
        }
        self.flags.append(flag)
        
        # Log with appropriate level
        level_map = {
            "low": logging.INFO,
            "medium": logging.WARNING,
            "high": logging.ERROR,
            "critical": logging.CRITICAL
        }
        logger.log(
            level_map.get(severity, logging.INFO),
            f"[{severity.upper()}] {issue} → {recommendation}"
        )
    
    def start_task(self, task_name):
        """Mark the start of a new task."""
        self.task_history.append({
            "timestamp": datetime.now().isoformat(),
            "name": task_name,
            "status": "started",
            "tool_call_count": len(self.tool_calls)
        })
        self.flags = []  # Reset flags for new task
    
    def end_task(self, task_name, status="completed"):
        """Mark the end of a task."""
        self.task_history.append({
            "timestamp": datetime.now().isoformat(),
            "name": task_name,
            "status": status,
            "duration_calls": len(self.tool_calls)
        })
    
    def get_summary(self):
        """Return summary of task monitoring."""
        return {
            "total_tool_calls": len(self.tool_calls),
            "recent_calls": [c["tool"] for c in list(self.tool_calls)[-5:]],
            "flags": self.flags,
            "severity_levels": {
                "critical": len([f for f in self.flags if f["severity"] == "critical"]),
                "high": len([f for f in self.flags if f["severity"] == "high"]),
                "medium": len([f for f in self.flags if f["severity"] == "medium"]),
            }
        }
    
    def should_interrupt(self):
        """Determine if task should be interrupted due to loop detection."""
        critical_flags = [f for f in self.flags if f["severity"] == "critical"]
        if critical_flags:
            return True, critical_flags[0]
        return False, None
    
    def save_monitoring_report(self, filepath):
        """Save detailed monitoring report to file."""
        report = {
            "generated_at": datetime.now().isoformat(),
            "summary": self.get_summary(),
            "all_flags": self.flags,
            "tool_call_sequence": [c["tool"] for c in self.tool_calls],
            "task_history": list(self.task_history)
        }
        with open(filepath, "w") as f:
            json.dump(report, f, indent=2)


# Global instance
_monitor = TaskMonitor()


def log_tool_call(tool_name, params=None, result_summary=None):
    """Convenience function for logging tool calls."""
    _monitor.log_tool_call(tool_name, params, result_summary)


def start_task(task_name):
    """Mark start of task."""
    _monitor.start_task(task_name)


def end_task(task_name, status="completed"):
    """Mark end of task."""
    _monitor.end_task(task_name, status)


def get_summary():
    """Get monitoring summary."""
    return _monitor.get_summary()


def should_interrupt():
    """Check if task should be interrupted."""
    return _monitor.should_interrupt()


def save_report(filepath):
    """Save monitoring report."""
    _monitor.save_monitoring_report(filepath)


if __name__ == "__main__":
    # Example usage
    monitor = TaskMonitor()
    
    # Simulate task execution
    monitor.start_task("Build Calculator")
    
    # Simulate tool calls
    tools = ["terminal", "read_file", "write_file", "terminal", "read_file"]
    for i, tool in enumerate(tools * 2):  # Repeat to trigger patterns
        monitor.log_tool_call(tool, {"iteration": i})
        time.sleep(0.1)
    
    print("Task Summary:")
    print(json.dumps(monitor.get_summary(), indent=2))
    
    should_stop, reason = monitor.should_interrupt()
    if should_stop:
        print(f"\n⚠️  TASK SHOULD BE INTERRUPTED: {reason['issue']}")
