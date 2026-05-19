"""
Smooth Concrete Driveway Calculator - FastAPI Backend v1.3
Handles: form submission, HUM optimization, final price calculation, email inquiry logging
"""

import os
import json
import smtplib
from datetime import datetime
from pathlib import Path
from typing import Optional, List
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from pricing_engine import PricingEngine
import yaml


app = FastAPI(title="Smooth Concrete Driveway Calculator")

# CORS setup - allow embedding in any domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files
frontend_dir = Path(__file__).parent.parent / "frontend"
app.mount("/frontend", StaticFiles(directory=frontend_dir, html=True), name="frontend")

# Initialize pricing engine and config
pricing_engine = PricingEngine()
config_path = Path(__file__).parent.parent / "config" / "pricing.yaml"
with open(config_path, "r") as f:
    config = yaml.safe_load(f)

# Logging & uploads directories
LOGS_DIR = Path(__file__).parent.parent / "logs"
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
LOGS_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)

# Health check tracking
_startup_time = datetime.now()
_health_checks = 0


@app.get("/health")
async def health_check():
    """
    Health check endpoint for supervisor monitoring.
    Returns 200 OK if the server is running normally.
    """
    global _health_checks
    _health_checks += 1
    uptime = (datetime.now() - _startup_time).total_seconds()
    return {
        "status": "healthy",
        "uptime_seconds": uptime,
        "health_check_number": _health_checks,
        "timestamp": datetime.now().isoformat()
    }


class CalculatorSubmission(BaseModel):
    """Request model for calculator submission"""
    # Customer details
    name: str
    phone: str
    email: str
    suburb: str
    
    # Area measurement method
    measurement_method: str  # "total", "sections", or "plans"
    total_area: Optional[float] = None
    areas: Optional[List[dict]] = None
    
    # Finish
    finish: str
    
    # Existing surface
    existing_removal: str  # "yes" or "no"
    
    # Slope
    slope: str
    
    # Drainage
    drainage: str
    strip_drain_length: Optional[float] = None
    
    # Photo count
    photo_count: int = 0


def calculate_estimate(submission: CalculatorSubmission) -> dict:
    """
    Calculate complete estimate with HUM optimization.
    Returns dict with all modifiers, original/optimized brackets, and repayments.
    """
    
    # Determine area from measurement method
    area_sqm = None
    measurement_source = None
    
    if submission.measurement_method == "total":
        area_sqm = submission.total_area
        measurement_source = "total_area"
    elif submission.measurement_method == "sections":
        if submission.areas:
            area_sqm = sum(area.get("length", 0) * area.get("width", 0) for area in submission.areas)
        measurement_source = "sections"
    else:  # "plans"
        area_sqm = None
        measurement_source = "plans"
    
    # Get finish and base rate
    finish_desc, base_rate = pricing_engine.get_base_rate(submission.finish, area_sqm or 50)
    
    if area_sqm is None:
        base_cost = 0
    else:
        base_cost = base_rate * area_sqm
    
    # Calculate all modifiers
    excavation_desc, excavation_cost = pricing_engine.calculate_excavation(area_sqm or 50)
    demolition_desc, demolition_cost = pricing_engine.calculate_demolition(area_sqm or 50, submission.existing_removal == "yes")
    steepness_desc, steepness_cost = pricing_engine.calculate_steepness(submission.slope, area_sqm or 50)
    pump_desc, pump_cost = pricing_engine.calculate_pump(submission.slope, area_sqm or 50)
    drain_desc, drain_cost = pricing_engine.calculate_strip_drain(submission.drainage, submission.strip_drain_length)
    
    # Build line items
    line_items = [
        {"description": finish_desc, "amount": base_cost},
        {"description": excavation_desc, "amount": excavation_cost},
        {"description": demolition_desc, "amount": demolition_cost},
        {"description": steepness_desc, "amount": steepness_cost},
        {"description": pump_desc, "amount": pump_cost},
        {"description": drain_desc, "amount": drain_cost},
    ]
    
    subtotal_ex_gst = sum(item["amount"] for item in line_items)
    
    # Calculate with optimization
    calc_result = pricing_engine.calculate_with_optimization(subtotal_ex_gst)
    
    # Flags for review
    flags = []
    if measurement_source == "plans":
        flags.append("Plans provided instead of measurements - requires scaling/review")
    if submission.drainage == "unsure":
        flags.append("Drainage status uncertain - flagged for confirmation")
    if submission.slope == "extremely_steep":
        flags.append("Extremely steep driveway - may require additional site inspection")
    if pump_cost > 0:
        flags.append("Pump required - cost included in estimate")
    if area_sqm and area_sqm > 100:
        flags.append("Large driveway (>100m²) - line pump may apply, confirm during review")
    if calc_result["optimization_occurred"]:
        flags.append(f"Optimization applied: Discounted ${calc_result['discount_applied']:,.2f} to lower HUM bracket")
    
    return {
        "area_sqm": area_sqm,
        "measurement_source": measurement_source,
        "line_items": [item for item in line_items if item["amount"] > 0],
        
        # Original calculation
        "original_subtotal_ex_gst": round(calc_result["original_subtotal"], 2),
        "original_bracket": calc_result["original_bracket"],
        
        # Optimization details
        "optimization_occurred": calc_result["optimization_occurred"],
        "discount_applied": round(calc_result["discount_applied"], 2),
        "optimized_bracket": calc_result["optimized_bracket"],
        "optimization_details": calc_result["optimization_details"],
        
        # Final calculation
        "final_subtotal_ex_gst": round(calc_result["optimized_subtotal"], 2),
        "finance_adjusted_ex_gst": round(calc_result["finance_adjusted_ex_gst"], 2),
        "gst_amount": round(calc_result["gst_amount"], 2),
        "final_inc_gst": round(calc_result["final_inc_gst"], 2),
        
        # Repayment (using optimized bracket)
        "repayment": pricing_engine.calculate_repayments(
            calc_result["final_inc_gst"],
            calc_result["optimized_bracket"]["fortnights"]
        ),
        
        "review_flags": flags
    }


def send_inquiry_email(submission: CalculatorSubmission, estimate: dict, uploaded_files: List[tuple] = None) -> bool:
    """
    Send detailed inquiry email to Luke with full breakdown.
    uploaded_files: list of (filename, filepath) tuples
    """
    
    try:
        # Build email content
        email_body = build_inquiry_email(submission, estimate)
        
        # Create message
        msg = MIMEMultipart()
        msg["From"] = config["email"]["from"]
        msg["To"] = config["email"]["to"]
        msg["Subject"] = config["email"]["subject_template"].format(
            name=submission.name,
            final_estimate=f"${estimate['final_inc_gst']:,.0f}"
        )
        
        # Attach body
        msg.attach(MIMEText(email_body, "html"))
        
        # Attach uploaded photos
        if uploaded_files:
            for filename, filepath in uploaded_files:
                try:
                    with open(filepath, "rb") as attachment:
                        part = MIMEBase("application", "octet-stream")
                        part.set_payload(attachment.read())
                        encoders.encode_base64(part)
                        part.add_header("Content-Disposition", f"attachment; filename= {filename}")
                        msg.attach(part)
                except Exception as e:
                    print(f"Warning: Could not attach {filename}: {e}")
        
        # Get SMTP credentials
        smtp_server = os.getenv("SMTP_SERVER", "smtp.outlook.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        
        # Check if in test mode
        if smtp_user == "test@example.com" or smtp_password == "test-password":
            print(f"\n[TEST MODE] Email would be sent to {config['email']['to']}")
            print(f"Subject: {msg['Subject']}")
            print(f"Final price: ${estimate['final_inc_gst']:,.2f}")
            return True
        
        if not smtp_user or not smtp_password:
            print("Warning: SMTP credentials not configured. Email not sent.")
            return False
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        return True
    
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def build_inquiry_email(submission: CalculatorSubmission, estimate: dict) -> str:
    """Build HTML email body with full breakdown (internal only)"""
    
    # Line items
    line_items_html = ""
    for item in estimate["line_items"]:
        line_items_html += f"""
        <tr>
            <td style="padding: 6px; border-bottom: 1px solid #f0f0f0;">{item['description']}</td>
            <td style="padding: 6px; border-bottom: 1px solid #f0f0f0; text-align: right;">${item['amount']:,.2f}</td>
        </tr>
        """
    
    # Flags
    flags_html = ""
    if estimate["review_flags"]:
        flags_html = "<p><strong>⚠️ Review Flags:</strong></p><ul>"
        for flag in estimate["review_flags"]:
            flags_html += f"<li>{flag}</li>"
        flags_html += "</ul>"
    
    # Optimization details
    optimization_html = ""
    if estimate["optimization_occurred"]:
        opt = estimate["optimization_details"]
        optimization_html = f"""
        <div style="background: #f0f8ff; padding: 12px; border-left: 4px solid #2196F3; margin: 10px 0;">
            <strong>✓ HUM Bracket Optimization Applied</strong><br/>
            Original bracket: {estimate['original_bracket']['range_desc']} @ {estimate['original_bracket']['fee_percent']}%<br/>
            Optimized bracket: {estimate['optimized_bracket']['range_desc']} @ {estimate['optimized_bracket']['fee_percent']}%<br/>
            Discount applied: ${estimate['discount_applied']:,.2f}<br/>
            Merchant fee savings: ${opt['fee_savings']:,.2f}<br/>
            Net benefit: ${opt['net_benefit']:,.2f}
        </div>
        """
    
    html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; color: #333; }}
            .container {{ max-width: 700px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #2c3e50; color: white; padding: 20px; border-radius: 4px; margin-bottom: 20px; }}
            .section {{ margin-bottom: 20px; }}
            .section h3 {{ color: #2c3e50; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 10px; }}
            table {{ width: 100%; border-collapse: collapse; }}
            .price-table {{ margin-bottom: 15px; }}
            .price-table td {{ padding: 8px; border-bottom: 1px solid #e0e0e0; }}
            .price-table .label {{ font-weight: bold; width: 40%; }}
            .final-price {{ background: #f0f0f0; padding: 15px; margin: 10px 0; border-left: 4px solid #27ae60; }}
            .final-price .amount {{ font-size: 28px; font-weight: bold; color: #27ae60; }}
            .repayment-box {{ background: #fff9e6; padding: 12px; border-left: 4px solid #ff9800; }}
            .repayment-box .weekly {{ font-size: 20px; font-weight: bold; color: #ff9800; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Driveway Estimate Inquiry</h2>
                <p>Received: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="section">
                <h3>Customer Details</h3>
                <table class="price-table">
                    <tr><td class="label">Name:</td><td>{submission.name}</td></tr>
                    <tr><td class="label">Phone:</td><td>{submission.phone}</td></tr>
                    <tr><td class="label">Email:</td><td>{submission.email}</td></tr>
                    <tr><td class="label">Suburb/Postcode:</td><td>{submission.suburb}</td></tr>
                </table>
            </div>
            
            <div class="section">
                <h3>Project Details</h3>
                <table class="price-table">
                    <tr><td class="label">Finish:</td><td>{submission.finish.replace('_', ' ').title()}</td></tr>
                    <tr><td class="label">Area:</td><td>{estimate['area_sqm'] or 'Per plans'} m²</td></tr>
                    <tr><td class="label">Measurement Source:</td><td>{estimate['measurement_source'].replace('_', ' ').title()}</td></tr>
                    <tr><td class="label">Existing Surface Removal:</td><td>{'Yes' if submission.existing_removal == 'yes' else 'No'}</td></tr>
                    <tr><td class="label">Slope:</td><td>{submission.slope.replace('_', ' ').title()}</td></tr>
                    <tr><td class="label">Drainage:</td><td>{submission.drainage.title()}</td></tr>
                </table>
            </div>
            
            <div class="section">
                <h3>Pricing Breakdown</h3>
                <table class="price-table">
                    {line_items_html}
                    <tr style="font-weight: bold; background: #f9f9f9;">
                        <td>Subtotal (ex GST, ex finance)</td>
                        <td style="text-align: right;">${estimate['original_subtotal_ex_gst']:,.2f}</td>
                    </tr>
                </table>
            </div>
            
            <div class="section">
                <h3>HUM Finance Calculation</h3>
                <table class="price-table">
                    <tr><td class="label">Original HUM Bracket:</td><td>{estimate['original_bracket']['range_desc']} @ {estimate['original_bracket']['fee_percent']}%</td></tr>
                    <tr><td class="label">Original Repayment Terms:</td><td>{estimate['original_bracket']['fortnights']} fortnights ({estimate['original_bracket']['fortnights']*2} weeks)</td></tr>
                </table>
                
                {optimization_html}
                
                <table class="price-table">
                    <tr><td class="label">Final HUM Bracket:</td><td>{estimate['optimized_bracket']['range_desc']} @ {estimate['optimized_bracket']['fee_percent']}%</td></tr>
                    <tr><td class="label">Finance-Adjusted (ex GST):</td><td style="text-align: right;">${estimate['finance_adjusted_ex_gst']:,.2f}</td></tr>
                    <tr><td class="label">GST (10%):</td><td style="text-align: right;">${estimate['gst_amount']:,.2f}</td></tr>
                </table>
                
                <div class="final-price">
                    <div>Final Estimate (inc GST)</div>
                    <div class="amount">${estimate['final_inc_gst']:,.2f}</div>
                </div>
            </div>
            
            <div class="section">
                <h3>Customer-Facing Repayment</h3>
                <div class="repayment-box">
                    <p><strong>Weekly Repayment Amount</strong></p>
                    <div class="weekly">${estimate['repayment']['weekly']:,.2f}/week</div>
                    <p style="margin: 8px 0 0 0; font-size: 12px;">
                        {estimate['repayment']['fortnights']} fortnights ({estimate['repayment']['term_weeks']} weeks)<br/>
                        Fortnightly: ${estimate['repayment']['fortnightly']:,.2f}/fn
                    </p>
                </div>
            </div>
            
            {flags_html if flags_html else ''}
            
            <div class="section">
                <p style="color: #666; font-size: 12px;">
                    This estimate was generated by the Smooth Concrete calculator.<br/>
                    All prices are estimates only and subject to site inspection and final approval.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html


def log_inquiry(submission: CalculatorSubmission, estimate: dict, uploaded_files: List[str] = None):
    """Log inquiry details to JSON file for record-keeping"""
    
    inquiry_record = {
        "timestamp": datetime.now().isoformat(),
        "customer": {
            "name": submission.name,
            "phone": submission.phone,
            "email": submission.email,
            "suburb": submission.suburb
        },
        "project": {
            "finish": submission.finish,
            "area_sqm": estimate["area_sqm"],
            "measurement_source": estimate["measurement_source"],
            "existing_removal": submission.existing_removal,
            "slope": submission.slope,
            "drainage": submission.drainage
        },
        "pricing": {
            "original_subtotal": estimate["original_subtotal_ex_gst"],
            "original_bracket": {
                "range": estimate["original_bracket"]["range_desc"],
                "fee_percent": estimate["original_bracket"]["fee_percent"]
            },
            "optimization_occurred": estimate["optimization_occurred"],
            "discount_applied": estimate["discount_applied"],
            "optimized_bracket": {
                "range": estimate["optimized_bracket"]["range_desc"],
                "fee_percent": estimate["optimized_bracket"]["fee_percent"]
            },
            "final_subtotal": estimate["final_subtotal_ex_gst"],
            "finance_adjusted_ex_gst": estimate["finance_adjusted_ex_gst"],
            "gst_amount": estimate["gst_amount"],
            "final_inc_gst": estimate["final_inc_gst"]
        },
        "repayment": {
            "weekly": estimate["repayment"]["weekly"],
            "fortnightly": estimate["repayment"]["fortnightly"],
            "term_weeks": estimate["repayment"]["term_weeks"],
            "fortnights": estimate["repayment"]["fortnights"]
        },
        "photos": uploaded_files or [],
        "review_flags": estimate["review_flags"]
    }
    
    # Save to dated log file
    log_file = LOGS_DIR / f"inquiries_{datetime.now().strftime('%Y-%m-%d')}.jsonl"
    with open(log_file, "a") as f:
        f.write(json.dumps(inquiry_record) + "\n")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/api/calculate")
async def submit_calculator(data: CalculatorSubmission):
    """
    Calculate estimate endpoint.
    Accepts JSON POST with calculator submission data.
    Returns: {success: true, estimate: {final_inc_gst, repayment_options, review_flags}}
    """
    
    try:
        # Calculate estimate
        estimate = calculate_estimate(data)
        
        # Build repayment options array for ALL HUM terms
        all_terms = [6, 13, 26, 39, 52, 65, 78]
        repayment_options = []
        for fn in all_terms:
            rep = pricing_engine.calculate_repayments(estimate["final_inc_gst"], fn)
            rep["num_fortnights"] = fn  # Add explicit field for frontend lookup
            repayment_options.append(rep)
        
        # Return estimate with all repayment options and flags
        return JSONResponse({
            "success": True,
            "estimate": {
                "final_inc_gst": estimate["final_inc_gst"],
                "repayment_options": repayment_options,
                "review_flags": estimate["review_flags"],
                # Hidden backend data for email
                "_internal": estimate
            }
        })
    
    except Exception as e:
        print(f"Error calculating estimate: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse({
            "success": False,
            "error": str(e)
        }, status_code=400)


@app.post("/api/submit")
async def submit_inquiry(
    name: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    suburb: str = Form(...),
    measurement_method: str = Form(...),
    total_area: Optional[float] = Form(None),
    areas: Optional[str] = Form(None),
    finish: str = Form(...),
    existing_removal: str = Form(...),
    slope: str = Form(...),
    drainage: str = Form(...),
    strip_drain_length: Optional[float] = Form(None),
    photo_count: int = Form(...),
    photos: Optional[List[UploadFile]] = File(None),
):
    """
    Final submission endpoint with file uploads.
    Calculates, logs, sends email.
    """
    
    try:
        # Parse areas JSON if sections method
        areas_list = None
        if measurement_method == "sections" and areas:
            areas_list = json.loads(areas)
        
        # Create submission object
        submission = CalculatorSubmission(
            name=name,
            phone=phone,
            email=email,
            suburb=suburb,
            measurement_method=measurement_method,
            total_area=total_area,
            areas=areas_list,
            finish=finish,
            existing_removal=existing_removal,
            slope=slope,
            drainage=drainage,
            strip_drain_length=strip_drain_length,
            photo_count=photo_count
        )
        
        # Calculate estimate
        estimate = calculate_estimate(submission)
        
        # Handle photo uploads
        uploaded_files = []
        if photos:
            for photo in photos:
                if photo.filename:
                    filepath = UPLOADS_DIR / f"{datetime.now().isoformat()}_{photo.filename}"
                    with open(filepath, "wb") as f:
                        f.write(await photo.read())
                    uploaded_files.append((photo.filename, str(filepath)))
        
        # Log inquiry
        log_inquiry(submission, estimate, [f[0] for f in uploaded_files])
        
        # Send email
        email_sent = send_inquiry_email(submission, estimate, uploaded_files)
        
        return JSONResponse({
            "success": True,
            "price": estimate["final_inc_gst"],
            "weekly_repayment": estimate["repayment"]["weekly"],
            "email_sent": email_sent,
            "message": "Thank you! Your inquiry has been submitted. We'll be in touch shortly."
        })
    
    except Exception as e:
        print(f"Error submitting inquiry: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get("/api/config")
async def get_config():
    """Return config for frontend"""
    return {
        "base_rates": config["base_rates"],
        "minimum_project_price": config["minimum_project_price"],
        "gst_rate": config["gst_rate"],
        "app": config["app"]
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
