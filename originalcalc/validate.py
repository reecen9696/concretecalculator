#!/usr/bin/env python3
"""
Quick validation script for Smooth Concrete Calculator
Tests pricing engine logic and config loading
"""

import sys
import yaml
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from pricing_engine import PricingEngine


def test_config_loading():
    """Test that config loads correctly"""
    print("\n✓ Testing config loading...")
    try:
        config_path = Path(__file__).parent / "config" / "pricing.yaml"
        with open(config_path, "r") as f:
            config = yaml.safe_load(f)
        
        # Validate key sections
        assert "base_rates" in config
        assert "hum_merchant_fees" in config
        assert "email" in config
        
        print(f"  ✓ Config loaded from {config_path}")
        print(f"  ✓ Natural grey rate: ${config['base_rates']['natural_grey']}/m²")
        print(f"  ✓ Exposed aggregate (0–60m²): ${config['base_rates']['exposed_aggregate']['range_0_60']}/m²")
        print(f"  ✓ HUM tiers: {len(config['hum_merchant_fees'])} tiers configured")
        print(f"  ✓ Email to: {config['email']['to']}")
        return True
    except Exception as e:
        print(f"  ✗ Config loading failed: {e}")
        return False


def test_pricing_engine():
    """Test core pricing calculations"""
    print("\n✓ Testing pricing engine...")
    try:
        engine = PricingEngine()
        
        # Test 1: Simple grey concrete 50m², flat, no removal
        print("\n  Test 1: Natural grey, 50m², flat, no extras")
        base_desc, base_rate = engine.get_base_rate("natural_grey", 50)
        base_cost = base_rate * 50
        excav_desc, excav_cost = engine.calculate_excavation(50)
        
        subtotal = base_cost + excav_cost
        subtotal = max(subtotal, engine.config["minimum_project_price"])
        
        finance_adj, final, gst = engine.calculate_final_price(subtotal)
        
        print(f"    Base ({base_desc}): ${base_cost:,.2f}")
        print(f"    Excavation: ${excav_cost:,.2f}")
        print(f"    Subtotal: ${subtotal:,.2f}")
        print(f"    Final (inc GST): ${final:,.2f}")
        
        assert final > subtotal, "Final price should be higher than subtotal"
        assert gst > 0, "GST should be positive"
        
        # Test 2: Exposed aggregate, steep, with demolition
        print("\n  Test 2: Exposed aggregate, 75m², extremely steep, demolition needed")
        base_desc, base_rate = engine.get_base_rate("exposed_aggregate", 75)
        base_cost = base_rate * 75
        excav_desc, excav_cost = engine.calculate_excavation(75)
        demo_desc, demo_cost = engine.calculate_demolition(75, True)
        steep_desc, steep_cost = engine.calculate_steepness("extremely_steep", 75)
        pump_desc, pump_cost = engine.calculate_pump("extremely_steep", 75)
        
        subtotal = base_cost + excav_cost + demo_cost + steep_cost + pump_cost
        subtotal = max(subtotal, engine.config["minimum_project_price"])
        
        finance_adj, tier = engine.apply_hum_merchant_fee(subtotal)
        final_inc_gst = finance_adj * 1.1
        
        print(f"    Base ({base_desc}): ${base_cost:,.2f}")
        print(f"    Excavation: ${excav_cost:,.2f}")
        print(f"    Demolition: ${demo_cost:,.2f}")
        print(f"    Steepness: ${steep_cost:,.2f}")
        print(f"    Pump: ${pump_cost:,.2f}")
        print(f"    Subtotal: ${subtotal:,.2f}")
        print(f"    HUM tier: {tier['range']} @ {tier['fee_percent']}%")
        print(f"    Final (inc GST): ${final_inc_gst:,.2f}")
        
        # Test 3: Repayment calculations
        print("\n  Test 3: Repayment options")
        repayments = engine.calculate_repayments(final_inc_gst)
        for r in repayments:
            print(f"    {r['term_weeks']} weeks: ${r['fortnightly']:,.2f}/fn (${r['weekly']:,.2f}/wk)")
        
        assert len(repayments) > 0, "Should have at least one repayment option"
        
        # Test 4: Input validation
        print("\n  Test 4: Input validation")
        
        test_inputs = {
            "name": "Test Customer",
            "phone": "0412345678",
            "email": "test@example.com",
            "suburb": "Docklands VIC",
            "has_measurements": "yes",
            "length": 6.0,
            "width": 3.5,
            "finish": "natural_grey",
            "photo_count": 1
        }
        
        is_valid, errors = engine.validate_inputs(test_inputs)
        print(f"    Input validation: {'✓ Valid' if is_valid else '✗ Invalid'}")
        if errors:
            for error in errors:
                print(f"      - {error}")
        
        return is_valid
    except Exception as e:
        print(f"  ✗ Pricing engine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_directories():
    """Test that required directories exist"""
    print("\n✓ Testing directory structure...")
    try:
        base = Path(__file__).parent
        required_dirs = ["backend", "frontend", "config", "logs", "uploads"]
        
        for d in required_dirs:
            dir_path = base / d
            if dir_path.exists():
                print(f"  ✓ {d}/")
            else:
                print(f"  ✗ {d}/ missing")
                return False
        
        return True
    except Exception as e:
        print(f"  ✗ Directory test failed: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("Smooth Concrete Calculator - Validation Script")
    print("=" * 60)
    
    tests = [
        test_directories,
        test_config_loading,
        test_pricing_engine
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    print("\n" + "=" * 60)
    if all(results):
        print("✓ All tests passed! Calculator is ready to use.")
        print("\nNext steps:")
        print("  1. Review config/pricing.yaml and adjust rates as needed")
        print("  2. Create backend/.env with SMTP credentials:")
        print("     SMTP_SERVER=smtp.outlook.com")
        print("     SMTP_PORT=587")
        print("     SMTP_USER=your-email@outlook.com")
        print("     SMTP_PASSWORD=your-app-password")
        print("  3. Run: python3 -m uvicorn backend.main:app --reload --port 8001")
        print("  4. Open: http://localhost:8001/frontend/")
        return 0
    else:
        print("✗ Some tests failed. Please review the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
