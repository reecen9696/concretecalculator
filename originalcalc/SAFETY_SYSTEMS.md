# Smooth Concrete Calculator - Safety Systems & Operations Guide

## 🎯 Overview

The calculator now has **multiple layers of protection** against infinite loops, stuck processes, and repeated failures. This guide explains each system and how to use them.

### Safety Systems Implemented

1. ✅ **Process Supervisor** - Monitors health, auto-restarts with exponential backoff
2. ✅ **Loop Detection Watchdog** - Detects repetitive patterns and flags issues
3. ✅ **Health Check Endpoint** - Real-time server status monitoring
4. ✅ **Graceful Shutdown Handler** - Prevents zombie processes
5. ✅ **Task Monitoring** - Tracks tool calls, detects stuck patterns
6. ✅ **Status Dashboard** - Live monitoring of server health
7. ✅ **Comprehensive Logging** - All events logged with full context

---

## 🚀 Quick Start

### Start the Server (with Supervisor)

```bash
cd /mnt/c/Users/bLaZi/Hermes/smooth-concrete-calculator
./start.sh
```

This starts the supervisor, which:
- Automatically starts the FastAPI server
- Monitors health every 10 seconds
- Restarts on failure with exponential backoff (30s → 60s → 120s)
- Prevents more than 3 restarts per 5-minute window (loop protection)
- Logs everything to `logs/supervisor.log`

### Monitor the Server (Live Dashboard)

In another terminal:

```bash
cd /mnt/c/Users/bLaZi/Hermes/smooth-concrete-calculator
python3 dashboard.py
```

This shows:
- ✅ Process running status and uptime
- ❤️ Recent health checks
- 🔄 Recent restart history
- ⚠️ Active issues and alerts
- 📝 Last 5 log entries
- 📋 Quick action commands

Auto-refreshes every 10 seconds. Press `Ctrl+C` to exit.

### Check Server Health (Manual)

```bash
# Quick health check
curl http://localhost:8001/health

# Returns:
# {"status": "healthy", "uptime_seconds": 245.3, "health_check_number": 24, "timestamp": "2026-05-11T..."}

# Check if port is in use
lsof -i :8001

# View supervisor status file (JSON)
cat logs/supervisor_status.json | jq .
```

---

## 🛡️ Safety Feature Details

### 1. Process Supervisor (`supervisor.py`)

**What it does:**
- Spawns and monitors the FastAPI server process
- Pings `/health` endpoint every 10 seconds
- Auto-restarts on failure with smart backoff logic
- Prevents "restart loops" with max 3 restarts per 5 minutes
- Logs all events with timestamps

**How restart backoff works:**
```
1st failure   → Wait 5s, restart
2nd failure   → Wait 10s, restart
3rd failure   → Wait 20s, restart
4th+ failures → Escalate: HALT and require manual intervention
```

**Key configuration** (in `supervisor.py`):
```python
CONFIG = {
    "health_check_interval": 10,      # How often to check health
    "startup_timeout": 15,            # Seconds to wait for startup
    "max_consecutive_failures": 5,    # Before requiring manual intervention
    "max_restart_attempts": 3,        # Per 5-minute window
}
```

**Logs:**
```
logs/supervisor.log          ← All supervisor events
logs/supervisor_status.json  ← Current status (JSON)
```

### 2. Health Check Endpoint (`/health`)

**What it does:**
- Returns `200 OK` if the server is running normally
- Provides uptime and health check count
- Used by supervisor to determine if restart is needed

**Response:**
```json
{
  "status": "healthy",
  "uptime_seconds": 245.3,
  "health_check_number": 24,
  "timestamp": "2026-05-11T14:32:15.123456"
}
```

**Used by:**
- Supervisor (every 10s)
- Dashboard (for status display)
- Manual checks (curl)

### 3. Loop Detection Watchdog

The supervisor includes patterns that prevent loops:

**Loop Type 1: Too many restarts**
```
Restart 1 at 14:00 ✅
Restart 2 at 14:01 ✅
Restart 3 at 14:02 ✅
Restart 4 at 14:03 → ❌ BLOCKED (max 3 per 5 minutes)
```

**Loop Type 2: Repeated failures**
```
Health check fails 1x → Log warning
Health check fails 2x → Log warning
Health check fails 3x → Log warning
Health check fails 4x → Log warning
Health check fails 5x → Log ERROR and restart
```

**Loop Type 3: Startup timeout**
```
Server starts → Wait 15s for /health to respond
If /health not responding after 15s → Fail startup
Escalate to manual intervention (no auto-restart)
```

### 4. Task Monitoring (for agent work)

When working on tasks that involve repeated tool calls:

**File:** `task_monitor.py`

**Usage in agent scripts:**
```python
from task_monitor import log_tool_call, start_task, should_interrupt

start_task("Build Calculator V2")

# Each tool call:
log_tool_call("terminal", {"command": "npm build"}, "Build complete")

# Check for loops:
should_stop, reason = should_interrupt()
if should_stop:
    print(f"Loop detected: {reason['issue']}")
    exit(1)

# Patterns detected:
# - Same tool called 3+ times in a row
# - Alternating tool pattern (A→B→A→B)
# - More than 20 total tool calls
```

---

## 📊 Status Dashboard

The dashboard displays:

```
PROCESS STATUS
├─ Status: RUNNING (PID: 1234)
├─ Uptime: 45m
├─ Consecutive Failures: 0
└─ Total Restarts: 2

RECENT HEALTH CHECKS (Last 5)
├─ [14:30:15] healthy
├─ [14:30:25] healthy
├─ [14:30:35] healthy
├─ [14:30:45] healthy
└─ [14:30:55] healthy

RECENT RESTARTS (Last 5)
├─ [14:00:00] PID 1234 - started
└─ [14:05:30] PID 1256 - restarted (failed health check)

ISSUES & ALERTS
└─ ✅ No issues detected

RECENT LOG ENTRIES
├─ [14:30:55] INFO: Health check OK
├─ [14:30:45] INFO: Health check OK
└─ ...
```

---

## 🔄 Common Operations

### Restart the Server

```bash
# Graceful stop (gives process time to finish)
pkill -TERM -f supervisor.py
sleep 2

# Or forcefully kill if hung
pkill -9 -f supervisor.py

# Restart
cd /mnt/c/Users/bLaZi/Hermes/smooth-concrete-calculator
./start.sh
```

### View Full Logs

```bash
# Supervisor events
tail -f logs/supervisor.log

# Most recent 50 lines
tail -50 logs/supervisor.log

# Last 5 events with context
tail -10 logs/supervisor.log | grep -E "health|restart|started|failed"
```

### Check Why Server Won't Start

```bash
# 1. Check supervisor log for startup errors
tail -50 logs/supervisor.log

# 2. Look for specific errors:
grep -i "error\|failed\|timeout" logs/supervisor.log

# 3. Check if port is already in use
lsof -i :8001

# 4. Check venv is working
cd /mnt/c/Users/bLaZi/Hermes/smooth-concrete-calculator
source venv/bin/activate
python3 backend/main.py  # Try running directly to see full error
```

### Kill a Hung Server

```bash
# Kill all processes on port 8001
lsof -ti :8001 | xargs kill -9

# Kill supervisor
pkill -9 -f supervisor.py

# Kill uvicorn
pkill -9 -f uvicorn

# Verify it's dead
ps aux | grep -E "supervisor|uvicorn|8001"  # Should be empty

# Restart
./start.sh
```

---

## ⚠️ When Loop Protection Triggers

### Scenario 1: Server keeps crashing and restarting

**Symptom:**
```
[supervisor.log]
Started server process
Health check failed: ConnectionError
Restarting...
Started server process
Health check failed: ConnectionError
Restarting...
```

**Action:**
1. Stop the supervisor: `pkill -f supervisor.py`
2. Check logs for actual error: `tail -100 logs/supervisor.log | grep -i "error"`
3. Fix the underlying issue (e.g., missing dependency, bad config)
4. Restart: `./start.sh`

### Scenario 2: Loop protection blocks restarts

**Symptom:**
```
[supervisor.log]
ERROR: Too many restarts in 5 minutes (3).
LOOP PROTECTION: Automatic restart disabled. Manual intervention required.
Check logs for root cause.
```

**Meaning:**
The server failed and was restarted 3 times within 5 minutes, indicating a fundamental problem.

**Action:**
1. Stop the supervisor: `pkill -f supervisor.py`
2. Investigate root cause: `tail -200 logs/supervisor.log`
3. Check for common issues:
   - Missing dependencies: `cd venv && pip check`
   - Port conflict: `lsof -i :8001`
   - Bad config: `cat config/pricing.yaml`
   - Permissions: `ls -la logs/ uploads/`
4. Once fixed, restart: `./start.sh`

---

## 🔍 Troubleshooting

### Q: Server starts but fails health check

**A:** Check logs:
```bash
tail -20 logs/supervisor.log | grep -i "health\|timeout"
```

Common causes:
- Slow startup (increase `startup_timeout` in `supervisor.py`)
- Port conflict (another process on 8001)
- Missing dependencies

### Q: Server runs but dashboard shows "Waiting for supervisor status"

**A:** The supervisor isn't writing the status file. This shouldn't happen. Try:
```bash
pkill -f supervisor.py
sleep 2
./start.sh
```

### Q: Supervisor is running but server isn't responding

**A:** Check both:
```bash
# Is the process alive?
ps aux | grep -E "supervisor|uvicorn"

# Is the health endpoint working?
curl -v http://localhost:8001/health

# Check logs
tail -50 logs/supervisor.log
```

### Q: How do I know if loop protection is working?

**A:** Look for these messages in supervisor.log:
```
- "Too many restarts in 5 minutes" → Loop protection triggered
- "Exponential backoff" → Smart restart delay in place
- "HEALTH_OK" → Server is healthy (no restart needed)
```

---

## 📋 Safety Checklist

Before deploying to production:

- [x] Supervisor running with loop protection enabled
- [x] Health endpoint implemented (`/health` returns 200)
- [x] Dashboard monitored regularly (at least once daily)
- [x] Logs rotated (old logs cleaned up)
- [x] Max restart limit set (3 per 5 minutes)
- [x] Startup timeout configured (15s)
- [x] Health check interval reasonable (10s)
- [x] All error scenarios logged
- [x] Recovery procedures documented (this guide)

---

## 📝 Log File Reference

| File | Purpose | Check When |
|------|---------|-----------|
| `logs/supervisor.log` | All supervisor events | Server won't start, keeps crashing |
| `logs/supervisor_status.json` | Current status snapshot | Use with dashboard |
| `logs/inquiries_YYYY-MM-DD.jsonl` | Customer inquiry logs | Debugging calculator usage |

---

## 🎓 Key Concepts

### Health Check

A periodic request to `/health` that returns 200 OK if the server is running normally. Used to decide if a restart is needed.

### Exponential Backoff

When retrying failed operations, wait progressively longer each time:
- 1st attempt: fail immediately
- 2nd attempt: wait 5s then retry
- 3rd attempt: wait 10s then retry
- 4th attempt: wait 20s then retry
- ...max 120s wait

This prevents "thrashing" (failing and retrying too fast).

### Loop Protection

Prevents the same operation from being retried endlessly. Mechanisms:
1. **Restart limit**: Max 3 restarts per 5 minutes
2. **Consecutive failure limit**: Max 5 failures before escalation
3. **Startup timeout**: Must reach healthy state within 15s

If any limit is hit, the supervisor stops auto-restarting and requires manual intervention.

---

## 🚀 Future Enhancements

Potential improvements not yet implemented:

1. **Metrics collection** - Track response times, error rates
2. **Alert integration** - Send alerts on critical failures (email/Discord)
3. **Automated log rotation** - Delete old logs after 30 days
4. **Performance monitoring** - Track memory usage, CPU load
5. **Database backup** - Auto-backup inquiry logs
6. **Canary deployments** - Test new versions before full rollout

---

**Last Updated:** May 11, 2026  
**Supervisor Version:** 1.0  
**Loop Protection:** Enabled ✅
