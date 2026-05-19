# SMOOTH CONCRETE DRIVEWAY CALCULATOR
## Complete Deployment & Setup Guide

**Version:** 1.3  
**Last Updated:** May 11, 2026  
**Status:** Beta - Ready for Internal Testing

---

## TABLE OF CONTENTS

1. [Quick Start (5 Minutes)](#quick-start)
2. [System Requirements](#system-requirements)
3. [Installation](#installation)
4. [Running the Calculator](#running-the-calculator)
5. [Configuration](#configuration)
6. [Embedding on Website](#embedding-on-website)
7. [Email Setup](#email-setup)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Integration Points for Website Team](#integration-points-for-website-team)

---

## QUICK START

### Prerequisites
- Linux system or WSL (Windows Subsystem for Linux)
- Python 3.12+
- ~300 MB disk space (excluding venv dependencies)

### 3-Step Startup

```bash
# 1. Navigate to calculator directory
cd smooth-concrete-calculator

# 2. Run startup script
./start.sh

# 3. Open in browser
# http://localhost:8001/frontend/
```

**That's it.** Server will be healthy in ~15 seconds.

---

## SYSTEM REQUIREMENTS

### Operating System
- **Recommended:** Linux (native) or WSL2 (Windows Subsystem for Linux 2)
- **Not tested on:** macOS, Docker, Kubernetes
- **Bash:** Required (for start.sh script)

### Runtime
- **Python:** 3.12 or higher
- **Virtual Environment:** venv (included in Python 3.3+)
- **Memory:** 512 MB minimum (for venv + server)
- **Disk:** 500 MB total (venv ~150 MB, code ~50 MB, uploads/logs grow over time)

### Network
- **Port:** 8001 (must be available)
- **Firewall:** Open port 8001 for incoming connections
- **CORS:** Enabled for all origins (can be restricted if needed)

### Dependencies (Automatically Installed)
```
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.4.2
pyyaml==6.0.1
python-multipart==0.0.6
requests==2.31.0
python-docx==0.8.11 (for future PDF generation)
```

---

## INSTALLATION

### Step 1: Extract the ZIP File
```bash
unzip smooth-concrete-calculator.zip
cd smooth-concrete-calculator
```

### Step 2: Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Verify Installation
```bash
python3 -c "import fastapi; import pydantic; print('✅ All dependencies installed')"
```

---

## RUNNING THE CALCULATOR

### Option 1: Automated Startup (Recommended)

```bash
./start.sh
```

**What happens:**
1. Checks for existing processes
2. Cleans up port 8001
3. Starts FastAPI server with health monitoring
4. Waits for server to be healthy (~10-15 seconds)
5. Returns when ready

### Option 2: Manual Startup (For Development)

```bash
source venv/bin/activate
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

**Note:** `--reload` flag restarts server on code changes (development only, don't use in production)

### Accessing the Calculator

**Frontend:** `http://localhost:8001/frontend/`  
**Health Check:** `http://localhost:8001/health`  
**API Config:** `http://localhost:8001/api/config`

### Stopping the Server

```bash
# Method 1: Kill by port
lsof -ti :8001 | xargs kill -9

# Method 2: Kill supervisor process
pkill -f supervisor.py

# Method 3: Graceful shutdown (takes ~10 seconds)
pkill -TERM supervisor.py
```

---

## CONFIGURATION

### Pricing Configuration (pricing.yaml)

**Location:** `config/pricing.yaml`

**Key Sections:**

#### 1. Base Rates ($/m²)
```yaml
base_rates:
  natural_grey: 110
  coloured: 130
  exposed_aggregate:
    range_0_60: 220
    range_60_100: 210
    range_100_plus: 190
  pavilion_finish: 150
```

#### 2. Modifiers (Fixed Costs)
```yaml
excavation:
  base_allowance: 1500        # 0–65m²
  above_65: 500
  above_120: 500

demolition:
  minimum_allowance: 2200     # 0–50m²
  above_50_per_sqm: 50

strip_drain:
  up_to_6m: 1500
  6_to_10m: 2000

steepness:
  flat_minimal: 0
  moderately_steep: 500
  extremely_steep:
    25_50: 1000
    50_plus: 0

pump:
  boom_pump_cost: 2000
  boom_required_above: 50
```

#### 3. HUM Finance Brackets
```yaml
hum_brackets:
  - from: 80, to: 1000, fortnights: 6, fee: 4.00
  - from: 1000.01, to: 2000, fortnights: 13, fee: 4.67
  # ... (7 total brackets)
  - from: 10000.01, to: 15000, fortnights: 78, fee: 17.98
```

**Edit:** Open `config/pricing.yaml` in any text editor. Changes take effect after server restart.

### Email Configuration (.env)

**Location:** Create `.env` file in root directory (not included in repo for security)

**Required for Production:**
```env
SMTP_SERVER=smtp.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-app-specific-password
```

**Without .env:** Email prints to console (test mode)

### Application Settings (in pricing.yaml)

```yaml
app:
  max_upload_size_mb: 10
  allowed_photo_types: [".jpg", ".jpeg", ".png", ".gif", ".webp"]
  required_photo_count: 1
  optional_photos_max: 5

email:
  to: lukeshah100@gmail.com
  from: calculator@smoothconcrete.com.au
  subject_template: "Driveway Estimate - {name} - ${final_estimate}"

gst_rate: 0.1  # 10%

hum_optimization:
  enabled: true
  max_discount_allowance: 450
```

---

## EMBEDDING ON WEBSITE

### Option 1: Iframe Embed (Simplest)

```html
<iframe 
  src="http://your-domain:8001/frontend/" 
  style="width: 100%; height: 1000px; border: none; border-radius: 8px;"
  title="Driveway Calculator">
</iframe>
```

**Pros:**
- Simple to implement
- Isolated from main site
- No styling conflicts

**Cons:**
- Fixed height may not be responsive
- Limited customization

### Option 2: Reverse Proxy (Recommended for Production)

**Nginx Configuration:**
```nginx
location /calculator/ {
    proxy_pass http://localhost:8001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Access:** `https://smoothconcrete.com.au/calculator/`

**Pros:**
- Full domain integration
- Better SEO
- Shared SSL certificate
- Can add authentication/rate limiting at proxy level

**Cons:**
- Requires server configuration
- Need nginx or Apache

### Option 3: API-Only Integration

If website has custom frontend:

**POST /api/calculate**
```javascript
const response = await fetch('http://localhost:8001/api/calculate', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name, phone, email, suburb,
    measurement_method, total_area, areas,
    finish, existing_removal, slope, drainage, strip_drain_length,
    photo_count
  })
});
```

**POST /api/submit** (with file uploads)
```javascript
const formData = new FormData();
formData.append('name', name);
// ... append all fields
formData.append('photos', fileInput.files[0]);

const response = await fetch('http://localhost:8001/api/submit', {
  method: 'POST',
  body: formData
});
```

---

## EMAIL SETUP

### Why Email Isn't Configured by Default

- Security: SMTP credentials shouldn't be in repo
- Flexibility: Team can use any email provider
- Testing: Console output lets you test without SMTP

### Configuring Email (Production)

#### Step 1: Create `.env` File
```bash
cat > .env << EOF
SMTP_SERVER=smtp.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-app-specific-password
EOF
```

#### Step 2: Use App-Specific Password (Outlook)
1. Go to https://account.microsoft.com/security
2. Enable two-factor authentication
3. Generate app-specific password
4. Use that password (not your real password) in `.env`

#### Step 3: Restart Server
```bash
./start.sh
```

#### Step 4: Test Email
Submit a test quote through the form. Check email inbox.

#### Troubleshooting Email

**If email doesn't send:**

1. **Check credentials:** Make sure SMTP_USER/PASSWORD are correct
2. **Check firewall:** Port 587 might be blocked
3. **Check logs:** Look for SMTP errors in supervisor.log
4. **Test SMTP directly:**
   ```bash
   python3 << 'EOF'
   import smtplib
   server = smtplib.SMTP('smtp.outlook.com', 587)
   server.starttls()
   server.login('your-email@outlook.com', 'your-app-password')
   print("✅ SMTP connection successful")
   server.quit()
   EOF
   ```

---

## TROUBLESHOOTING

### Server Won't Start

**Error:** "Port 8001 is already in use"

```bash
# Kill process using port 8001
lsof -ti :8001 | xargs kill -9

# Then restart
./start.sh
```

**Error:** "Virtual environment not found"

```bash
# Create venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
./start.sh
```

### Health Check Failing

```bash
# Check supervisor log
tail -f logs/supervisor.log

# Test API directly
curl http://localhost:8001/health
```

### Photos Not Uploading

**Error:** "File too large"

- Max file size: 10 MB per photo
- Check that photo is actually < 10 MB

**Error:** "Unsupported format"

- Allowed types: .jpg, .jpeg, .png, .gif, .webp
- Convert image if needed

### Estimates Seem Wrong

**Debug Steps:**

1. Check config/pricing.yaml is valid YAML (use online YAML validator)
2. Check base rates match your costs
3. Test with known job size (e.g., 50m² flat natural grey)
4. Compare calculation step-by-step against manual math

### Email Not Sending

See [Email Setup](#email-setup) section above.

---

## MONITORING & MAINTENANCE

### Checking Server Status

```bash
# Health check
curl http://localhost:8001/health

# Monitor logs in real-time
tail -f logs/supervisor.log

# Check disk usage
du -sh ./*
du -sh logs/
du -sh uploads/
```

### Viewing Inquiries

```bash
# View all inquiries from today
tail -f logs/inquiries_$(date +%Y-%m-%d).jsonl

# Count inquiries
wc -l logs/inquiries_*.jsonl

# Pretty-print latest inquiry
tail -1 logs/inquiries_*.jsonl | python3 -m json.tool
```

### Cleaning Up Old Data

```bash
# Delete logs older than 30 days
find logs/ -name "*.jsonl" -mtime +30 -delete

# Delete uploaded photos older than 60 days
find uploads/ -type f -mtime +60 -delete

# Archive old logs (optional)
tar -czf logs_archive_$(date +%Y-%m).tar.gz logs/inquiries_*.jsonl
```

### Performance Monitoring

```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Monitor running processes
top -p $(pgrep -f uvicorn)
```

---

## INTEGRATION POINTS FOR WEBSITE TEAM

### What They Need to Know

#### 1. Frontend is Standalone
- Single HTML file: `frontend/index.html`
- No build process required
- Can be hosted anywhere (separate domain, subdomain, or embedded)

#### 2. Backend is RESTful
- All communication via JSON HTTP POST
- CORS enabled (can be restricted later)
- No session/cookie authentication (stateless)

#### 3. File Uploads
- Photos sent as multipart/form-data
- Max 10 MB per file
- Stored on calculator server (can move to S3 later)

#### 4. Email Notifications
- Inquiry emails sent to lukeshah100@gmail.com
- Includes customer details, pricing breakdown, photos
- Can be forwarded to CRM later

#### 5. Configuration is Hot-Swappable
- Pricing changes via `config/pricing.yaml`
- No code changes needed
- Restart server to apply changes

#### 6. Database is JSON Logs
- All inquiries logged to `logs/inquiries_YYYY-MM-DD.jsonl`
- Can be imported to database/CRM later
- No real-time sync (can add via webhook)

### Common Questions Website Team Might Ask

**Q: Can we change the styling to match our brand?**  
A: Yes. Open `frontend/index.html`, edit CSS variables at top. Colors, fonts, all customizable.

**Q: What happens if someone fills the form but doesn't submit?**  
A: No inquiry is logged. Browser localStorage can store draft (not currently implemented).

**Q: Can customers see the calculation breakdown?**  
A: Yes, they can expand "Line Items" box on estimate review page.

**Q: Do customers need a login?**  
A: No. Each submission is independent. No customer portal yet.

**Q: Can we redirect customers after submission?**  
A: Yes. Modify `frontend/index.html` function `submitFinal()` to redirect after success.

**Q: What's the daily inquiry limit?**  
A: No limit set. Can add rate limiting at nginx level if needed.

---

## FINAL NOTES

### Before Going Live

- [ ] Configure SMTP credentials in `.env`
- [ ] Re-enable photo validation (line 1076 in index.html)
- [ ] Add rate limiting (nginx/Cloudflare recommended)
- [ ] Test email delivery with real SMTP
- [ ] Test on target browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test mobile responsiveness
- [ ] Set up log rotation/cleanup schedule
- [ ] Document any custom changes made to pricing.yaml

### Support & Questions

For technical issues:
1. Check logs: `tail -f logs/supervisor.log`
2. Check health: `curl localhost:8001/health`
3. Review troubleshooting section above
4. Check MASTER_IMPLEMENTATION_SUMMARY.docx for detailed technical reference

### Version History

- **v1.3 (May 11, 2026):** Current. Production-ready beta. Email unconfigured.
- **v1.2 (May 9, 2026):** Loop detection added.
- **v1.0 (May 1, 2026):** Initial release.

---

**End of Deployment Guide**
