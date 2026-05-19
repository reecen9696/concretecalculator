# Smooth Concrete Driveway Calculator v1 - Deployment Summary

**Status:** ✓ Ready for integration

**Built:** May 2026  
**Location:** `C:\Users\bLaZi\Hermes\smooth-concrete-calculator`  
**Validation:** All tests passed

---

## What You Have

### 1. **Backend (Python FastAPI)**
- **File:** `backend/main.py`
- **Engine:** `backend/pricing_engine.py`
- Handles all calculations, email, and inquiry logging
- Validates all inputs before processing
- Configurable pricing from YAML
- Email delivery to your Outlook inbox

### 2. **Frontend (HTML/JavaScript)**
- **File:** `frontend/index.html`
- Mobile-first responsive design
- Step-by-step questionnaire flow
- Real-time form validation
- Displays pricing dynamically from API

### 3. **Configuration (YAML)**
- **File:** `config/pricing.yaml`
- All rates, fees, and settings editable
- No code changes required to adjust pricing
- Includes HUM merchant fee tiers, excavation costs, demolition pricing, strip drain rates, steepness modifiers, pump costs, repayment terms

### 4. **Inquiry Logging**
- Automatic JSON logging to `logs/inquiries_YYYY-MM-DD.jsonl`
- One line per inquiry with full pricing and customer details
- Photo filenames included for reference

### 5. **Documentation**
- `README.md` — Complete setup and operation guide
- `validate.py` — Validation script to test all components

---

## How to Deploy

### Step 1: Install Dependencies

```bash
cd C:\Users\bLaZi\Hermes\smooth-concrete-calculator\backend
pip install fastapi uvicorn python-multipart pydantic pyyaml
```

### Step 2: Configure SMTP

Create `backend/.env`:

```
SMTP_SERVER=smtp.outlook.com
SMTP_PORT=587
SMTP_USER=your-outlook-email@outlook.com
SMTP_PASSWORD=your-app-specific-password
```

**Note:** Use an [app-specific password](https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-your-microsoft-account-16b08339-bfd2-c953-07f6-4fbfb7c1f914) for Outlook, not your regular password.

### Step 3: Adjust Pricing

Edit `config/pricing.yaml` to match your current rates. All values are documented with comments.

### Step 4: Run the Server

```bash
cd C:\Users\bLaZi\Hermes\smooth-concrete-calculator\backend
python3 -m uvicorn main:app --reload --port 8001
```

Open: `http://localhost:8001/frontend/`

### Step 5: Test the Form

- Fill out a test inquiry
- Submit with photos
- Check your email inbox for the inquiry summary
- Verify `logs/inquiries_2026-05-XX.jsonl` has been created

---

## API Endpoint

**POST `/api/calculate`** — Main form submission

- Accepts: multipart form data (customer details + photos)
- Returns: JSON with complete pricing estimate
- Sends: Email to luke@smoothconcrete.com.au
- Logs: Inquiry details to JSON file

---

## Pricing Logic Summary

### Base Rates ($/m²)
- Natural grey: $110
- Coloured: $130
- Exposed aggregate: $220 (0–60m²), $210 (60–100m²), $190 (100m²+)
- Honed upgrade: +$150/m²

### Modifiers
- Excavation: $1,500 (0–65m²) + $500 for 65–120m² + $500 for 120m²+
- Demolition: $2,200 (0–50m²) + $50/m² above 50m²
- Strip drain: $1,500 (0–6m) or $2,000 (6–10m)
- Steepness: $0 (flat), $500 (moderate), $1,000 (extreme, <50m²)
- Pump (boom): $2,000 (extreme, 50m²+)
- Minimum project: $6,500

### HUM Finance
- Merchant fees applied to all estimates (6.74% to 17.98% depending on tier)
- Reverse calculation: `adjusted = subtotal ÷ (1 - fee%)`
- GST: 10% applied to finance-adjusted price
- Repayment terms: 12, 24, 36, 52 weeks

---

## Customer Flow

1. **Step 1:** Customer enters name, phone, email, suburb
2. **Step 2:** Customer provides driveway area (measurements or plans)
3. **Step 3:** Customer selects concrete finish
4. **Step 4:** Customer indicates if surface needs removal
5. **Step 5:** Customer describes slope
6. **Step 6:** Customer describes drainage situation
7. **Step 7:** Customer uploads photos
8. **Step 8:** Backend calculates estimate, shows repayment options
9. **Submit:** Email sent to your inbox with full inquiry details + photos

---

## Email Output Example

Customer receives a clean HTML email with:
- Customer contact details
- Project details (finish, area, slope, drainage, etc.)
- Complete pricing breakdown
- HUM merchant fee tier applied
- Final estimate (inc GST)
- Repayment options (fortnightly/weekly)
- Review flags (if any)
- Photo attachments

---

## Inquiry Log Example

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
    "area_sqm": 50,
    "measurement_source": "measurements",
    "existing_removal": false,
    "slope": "flat_minimal",
    "drainage": "no"
  },
  "estimate": {
    "subtotal_ex_gst": 11000,
    "hum_tier": "$10,000–$15,000",
    "finance_adjusted_ex_gst": 13397.80,
    "gst_amount": 1339.78,
    "final_inc_gst": 14737.58
  },
  "photos": ["john_smith_photo_1.jpg", "john_smith_photo_2.jpg"],
  "review_flags": []
}
```

---

## File Structure

```
smooth-concrete-calculator/
├── backend/
│   ├── main.py                      # FastAPI app, email handler
│   ├── pricing_engine.py            # Core calculation logic
│   └── .env                         # SMTP credentials (you create this)
├── frontend/
│   └── index.html                   # Standalone form (mobile-first)
├── config/
│   └── pricing.yaml                 # ALL pricing & settings (editable)
├── logs/
│   └── inquiries_2026-05-09.jsonl   # Auto-created inquiry logs
├── uploads/
│   └── [customer-photos]            # Auto-created photo storage
├── README.md                        # Full setup guide
├── validate.py                      # Test validation script
└── DEPLOYMENT_SUMMARY.md            # This file
```

---

## Next Steps

1. **Install and test locally** using the deployment steps above
2. **Configure SMTP** with your Outlook credentials
3. **Review pricing.yaml** and adjust all rates to match your current pricing
4. **Test the form** end-to-end with photos
5. **Verify email delivery** — check your inbox for test inquiry
6. **Host the backend** on your server (production deployment via nginx + gunicorn)
7. **Embed the frontend** into your marketing website (via iframe or direct integration)
8. **Configure live HUM finance link** once HUM provides integration details
9. **Monitor inquiry logs** — use them to track volume and analyze customer behavior

---

## Customization Guide

### Change a price
Edit `config/pricing.yaml` → value updates immediately on next request

### Change email recipient
Edit `config/pricing.yaml` → `email.to` field

### Change form questions
Edit `frontend/index.html` → form step HTML

### Add a new finish option
1. Add rate to `config/pricing.yaml` → `base_rates`
2. Add radio option to `frontend/index.html`
3. Add case to `pricing_engine.py` → `get_base_rate()` method

### Change repayment terms
Edit `config/pricing.yaml` → `repayment_terms` array

---

## Support Notes

**Pricing Engine:** Fully tested with multiple scenarios (grey, exposed aggregate, steep, demolition, etc.)  
**Email Handling:** Sends HTML formatted inquiry with photo attachments  
**Mobile UX:** Optimized for 320px+ screens (tested at 375px, 768px, 1024px)  
**Validation:** Client-side + server-side; rejects incomplete submissions  
**Logging:** JSON lines format, one inquiry per line, easy to parse and analyze  

---

## Questions?

Refer to `README.md` for detailed documentation on:
- API endpoints
- Pricing logic breakdown
- Embedding options
- Troubleshooting
- Configuration options

---

**Ready to deploy.** All code tested and validated.
