# Smooth Concrete Driveway Calculator - Installation & Setup Guide

## Overview

The Smooth Concrete Driveway Calculator is a lean, embeddable form that collects driveway project details, calculates a dynamic estimate with HUM finance integration, and sends inquiry data via email.

**Key Features:**
- Mobile-first responsive UX
- Server-side pricing calculations
- Configurable pricing (no code changes needed)
- Photo uploads with email delivery
- Inquiry logging to JSON
- HUM merchant fee tiers & repayment calculations
- Zero bloat — no dashboards, CRM, or approval systems

---

## System Architecture

```
┌─────────────────────────────────────────┐
│  Frontend (HTML/JS)                     │
│  └─ Step-by-step form                   │
│  └─ Mobile-first UX                     │
│  └─ Client-side validation              │
│  └─ Display pricing returned from API   │
└──────────────┬──────────────────────────┘
               │ POST /api/calculate
               │ (multipart: form + photos)
               ▼
┌─────────────────────────────────────────┐
│  Backend (FastAPI, Python)              │
│  ├─ Pricing Engine                      │
│  │  └─ All calculations server-side     │
│  │  └─ Config-driven rates              │
│  │  └─ HUM merchant fee logic           │
│  │  └─ GST & repayments                 │
│  ├─ Email Handler                       │
│  │  └─ HTML inquiry email               │
│  │  └─ Photo attachments                │
│  │  └─ Outlook SMTP integration         │
│  └─ Inquiry Logger                      │
│     └─ JSON log files                   │
└─────────────────────────────────────────┘
```

---

## Installation

### Prerequisites

- Python 3.8+
- pip
- SMTP credentials (Outlook or similar)

### Step 1: Install Dependencies

```bash
cd /path/to/smooth-concrete-calculator/backend

pip install fastapi uvicorn python-multipart pydantic pyyaml
```

### Step 2: Configure SMTP

Create a `.env` file in the `backend/` directory:

```
SMTP_SERVER=smtp.outlook.com
SMTP_PORT=587
SMTP_USER=your-outlook-email@outlook.com
SMTP_PASSWORD=your-app-password
```

**Note:** For Outlook, use an [app-specific password](https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-your-microsoft-account-16b08339-bfd2-c953-07f6-4fbfb7c1f914), not your regular password.

### Step 3: Review Pricing Configuration

Edit `config/pricing.yaml` to match your current rates:

```yaml
base_rates:
  natural_grey: 110         # $/m²
  coloured: 130             # $/m²
  exposed_aggregate:
    0_60: 220               # 0–60m²
    60_100: 210
    100_plus: 190

excavation:
  base_allowance: 1500      # Covers 0–65m²
  above_65: 500             # Additional for 65–120m²
  above_120: 500            # Additional for 120m²+

# ... etc
```

All pricing is editable here without touching code.

### Step 4: Update Email Address

In `config/pricing.yaml`, update the email address where inquiries are sent:

```yaml
email:
  to: luke@smoothconcrete.com.au
  from: calculator@smoothconcrete.com.au
```

---

## Running the Calculator

### Option A: Local Testing (Development)

```bash
cd /path/to/smooth-concrete-calculator/backend

python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

Then open `http://localhost:8001/` and navigate to `/frontend/index.html`.

### Option B: Production Deployment

Use a production ASGI server (gunicorn + uvicorn):

```bash
pip install gunicorn

gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8001
```

Use a reverse proxy (nginx) to serve the frontend and proxy API requests.

---

## Embedding Into a Landing Page

### Method 1: iframe Embed (Simplest)

```html
<iframe 
  src="https://your-domain.com/calculator"
  width="100%"
  height="1200"
  frameborder="0"
  allow="camera"
></iframe>
```

### Method 2: Direct Integration

Copy the entire `index.html` and host it alongside the API. Update the API endpoint in the JavaScript:

```javascript
// In index.html, around line 650:
const response = await fetch('/api/calculate', {
    method: 'POST',
    body: formData
});

// Change to your actual API endpoint:
const response = await fetch('https://api.smoothconcrete.com/api/calculate', {
    method: 'POST',
    body: formData
});
```

### CORS Configuration

The backend is already configured to allow cross-origin requests from any domain (for embeds). If you need to restrict this, update `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com", "https://www.example.com"],
    # ...
)
```

---

## File Structure

```
smooth-concrete-calculator/
├── config/
│   └── pricing.yaml                    # ALL pricing & config (editable)
├── backend/
│   ├── main.py                         # FastAPI app & email handler
│   ├── pricing_engine.py               # Core calculation logic
│   └── .env                            # SMTP credentials (git-ignored)
├── frontend/
│   └── index.html                      # Standalone HTML/JS form
├── logs/
│   └── inquiries_YYYY-MM-DD.jsonl      # Auto-created inquiry logs
├── uploads/
│   └── [customer-photos]               # Auto-created photo storage
└── README.md                           # This file
```

---

## API Endpoints

### POST `/api/calculate`

Main form submission endpoint.

**Request (multipart/form-data):**

```
name=John+Smith
phone=0412345678
email=john@example.com
suburb=Docklands+VIC+3008
has_measurements=yes
length=6
width=3.5
finish=exposed_aggregate
existing_removal=no
slope=flat_minimal
drainage=no
strip_drain_length=[optional]
photos=[file1.jpg, file2.jpg]
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Inquiry submitted successfully",
  "estimate": {
    "area_sqm": 21.0,
    "measurement_source": "measurements",
    "line_items": [
      {"description": "Exposed Aggregate", "amount": 4620.00},
      {"description": "Excavation (0–65m²)", "amount": 1500.00}
    ],
    "subtotal_ex_gst": 6120.00,
    "hum_tier": "$5,000–$7,000",
    "hum_fee_percent": 11.82,
    "finance_adjusted_ex_gst": 6952.49,
    "gst_amount": 695.25,
    "final_inc_gst": 7647.74,
    "repayment_options": [
      {"term_weeks": 12, "num_fortnights": 6, "fortnightly": 1274.62, "weekly": 637.31},
      {"term_weeks": 24, "num_fortnights": 12, "fortnightly": 637.31, "weekly": 318.66}
    ],
    "review_flags": ["Large driveway (>100m²) - line pump may apply, confirm during review"]
  },
  "email_sent": true,
  "hum_link": "https://hum.com.au"
}
```

### GET `/api/config`

Returns read-only pricing config for display purposes.

---

## Inquiry Logging

Every submission is automatically logged to a JSON Lines file:

`logs/inquiries_2026-05-09.jsonl`

Each line is a complete inquiry record:

```json
{
  "timestamp": "2026-05-09T14:32:15.123456",
  "customer": {
    "name": "John Smith",
    "phone": "0412345678",
    "email": "john@example.com",
    "suburb": "Docklands VIC 3008"
  },
  "project": {
    "finish": "exposed_aggregate",
    "area_sqm": 21.0,
    "measurement_source": "measurements",
    "existing_removal": false,
    "slope": "flat_minimal",
    "drainage": "no"
  },
  "estimate": {
    "subtotal_ex_gst": 6120.00,
    "hum_tier": "$5,000–$7,000",
    "finance_adjusted_ex_gst": 6952.49,
    "gst_amount": 695.25,
    "final_inc_gst": 7647.74
  },
  "photos": ["john_smith_photo_1.jpg", "john_smith_photo_2.jpg"],
  "review_flags": []
}
```

Use these logs to:
- Track inquiry volume
- Analyze customer behavior
- Export data for CRM integration (future)
- Debug pricing issues

---

## Updating Pricing

**NO code changes required.** Just edit `config/pricing.yaml`:

### Example: Update base rates

```yaml
base_rates:
  natural_grey: 115         # was 110, now 115
  coloured: 135             # was 130, now 135
```

Save the file. Changes are live on the next API call.

### Example: Adjust HUM merchant fees

```yaml
hum_merchant_fees:
  - from: 0
    to: 3500
    fee: 7.0              # was 6.74, now 7.0
```

---

## Troubleshooting

### Email not sending

1. Check SMTP credentials in `.env`
2. Verify Outlook app password (not regular password)
3. Check backend logs for error messages
4. Try a test SMTP connection:

```python
import smtplib
smtp_server = smtplib.SMTP("smtp.outlook.com", 587)
smtp_server.starttls()
smtp_server.login("your-email@outlook.com", "your-app-password")
print("✓ SMTP connected successfully")
```

### Form not submitting

1. Check browser console for JavaScript errors
2. Verify API endpoint is correct in `index.html`
3. Check CORS settings if embedding cross-domain
4. Ensure photos are uploaded

### Pricing calculations incorrect

1. Review `config/pricing.yaml` for stale values
2. Run the test in `pricing_engine.py`:

```bash
python pricing_engine.py
```

3. Check HUM merchant fee tiers match your agreement

---

## Future Enhancements (Not V1)

- Live HUM API integration for pre-approval checks
- SMS notifications
- Admin dashboard for inquiry review
- Automatic quote generation in Word/PDF
- Customer portal for status tracking
- Lead scoring & CRM integration

---

## Support

For questions on pricing logic, see `backend/pricing_engine.py`.  
For form UX changes, see `frontend/index.html`.  
For email formatting, see `backend/main.py` (build_inquiry_email function).

**Last updated:** May 2026
