"""
Smooth Concrete Driveway Calculator - Pricing Engine v1.3
Handles: base price, modifiers, HUM brackets, optimization, GST, repayments
"""

import yaml
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import math


class PricingEngine:
    def __init__(self, config_path: str = None):
        """Load pricing config from YAML file"""
        if config_path is None:
            config_path = Path(__file__).parent.parent / "config" / "pricing.yaml"
        
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
    
    def get_base_rate(self, finish: str, area_sqm: float) -> Tuple[str, float]:
        """
        Get base concrete rate for selected finish.
        Returns: (rate_description, rate_per_sqm)
        """
        if finish == "natural_grey":
            rate = self.config["base_rates"]["natural_grey"]
            return ("Natural Grey Concrete", rate)
        
        elif finish == "coloured":
            rate = self.config["base_rates"]["coloured"]
            return ("Coloured Concrete", rate)
        
        elif finish == "exposed_aggregate":
            rates = self.config["base_rates"]["exposed_aggregate"]
            if area_sqm < 60:
                rate = rates["range_0_60"]
            elif area_sqm < 100:
                rate = rates["range_60_100"]
            else:
                rate = rates["range_100_plus"]
            return ("Exposed Aggregate", rate)
        
        elif finish == "pavilion_finish":
            rate = self.config["base_rates"]["pavilion_finish"]
            return ("Pavilion Finish", rate)
        
        raise ValueError(f"Unknown finish: {finish}")
    
    def calculate_excavation(self, area_sqm: float) -> Tuple[str, float]:
        """Calculate excavation allowance based on area"""
        base = self.config["excavation"]["base_allowance"]
        
        if area_sqm <= 65:
            return ("Excavation (0–65m²)", base)
        
        cost = base + self.config["excavation"]["above_65"]
        
        if area_sqm >= 120:
            cost += self.config["excavation"]["above_120"]
        
        return ("Excavation (65m²+)", cost)
    
    def calculate_demolition(self, area_sqm: float, is_removal: bool) -> Tuple[str, float]:
        """Calculate demolition allowance if existing surface removal = YES"""
        if not is_removal:
            return ("Demolition (not required)", 0)
        
        config = self.config["demolition"]
        base = config["minimum_allowance"]
        
        if area_sqm <= 50:
            return ("Demolition (0–50m²)", base)
        
        above_50 = area_sqm - 50
        cost = base + (above_50 * config["above_50_per_sqm"])
        
        return ("Demolition (50m²+)", cost)
    
    def calculate_strip_drain(self, drainage_answer: str, length_m: float = None) -> Tuple[str, float]:
        """
        Calculate strip drain cost.
        drainage_answer: "no", "yes", "unsure"
        length_m: linear metres if known, None if unsure
        """
        if drainage_answer == "no":
            return ("Strip Drain (not required)", 0)
        
        if drainage_answer == "unsure":
            default_cost = self.config["strip_drain"]["default_if_unknown"]
            return ("Strip Drain (flagged for review)", default_cost)
        
        if drainage_answer == "yes":
            if length_m is None or length_m <= 6:
                cost = self.config["strip_drain"]["up_to_6m"]
                return ("Strip Drain (0–6m)", cost)
            else:
                cost = self.config["strip_drain"]["6_to_10m"]
                return ("Strip Drain (6–10m)", cost)
        
        raise ValueError(f"Unknown drainage answer: {drainage_answer}")
    
    def calculate_steepness(self, slope: str, area_sqm: float) -> Tuple[str, float]:
        """Calculate steepness labour modifier"""
        if slope == "flat_minimal":
            return ("Steepness (flat/minimal)", 0)
        
        elif slope == "moderately_steep":
            cost = self.config["steepness"]["moderately_steep"]
            return ("Steepness (moderately steep)", cost)
        
        elif slope == "extremely_steep":
            if area_sqm < 50:
                cost = self.config["steepness"]["extremely_steep"]["25_50"]
                return ("Steepness (extremely steep, <50m²)", cost)
            else:
                cost = self.config["steepness"]["extremely_steep"]["50_plus"]
                return ("Steepness (extremely steep, 50m²+)", cost)
        
        raise ValueError(f"Unknown slope: {slope}")
    
    def calculate_pump(self, slope: str, area_sqm: float) -> Tuple[str, float]:
        """Determine if pump required and cost"""
        if slope == "extremely_steep" and area_sqm >= 50:
            cost = self.config["pump"]["boom_pump_cost"]
            return ("Boom Pump (extremely steep, 50m²+)", cost)
        
        if area_sqm > 100:
            return ("Line Pump (100m²+, flag for review)", 0)
        
        return ("Pump (not required)", 0)
    
    def get_hum_bracket(self, amount: float) -> Dict:
        """
        Get HUM bracket for given amount.
        Returns: {from, to, fortnights, fee, range_desc}
        """
        brackets = self.config["hum_brackets"]
        
        for bracket in brackets:
            # Bracket logic: from <= amount <= to
            if bracket["from"] <= amount <= bracket["to"]:
                return {
                    "from": bracket["from"],
                    "to": bracket["to"],
                    "fortnights": bracket["fortnights"],
                    "fee_percent": bracket["fee"],
                    "range_desc": f"${bracket['from']:,.0f}–${bracket['to']:,.0f}"
                }
        
        # Fallback (shouldn't happen with good config)
        return brackets[-1]
    
    def apply_hum_fee(self, subtotal_ex_gst: float) -> Tuple[float, Dict]:
        """
        Apply HUM merchant fee using reverse calculation.
        Returns: (finance_adjusted_ex_gst, bracket_info)
        
        Formula: Finance adjusted = subtotal ÷ (1 - fee_percent)
        """
        bracket = self.get_hum_bracket(subtotal_ex_gst)
        fee_percent = bracket["fee_percent"]
        fee_decimal = fee_percent / 100
        
        finance_adjusted = subtotal_ex_gst / (1 - fee_decimal)
        
        return finance_adjusted, bracket
    
    def calculate_with_optimization(self, subtotal_ex_gst: float) -> Dict:
        """
        Calculate final price with optional optimization.
        
        Returns dict with:
        - original_subtotal
        - original_bracket
        - optimized_subtotal (if optimization applied)
        - optimized_bracket (if optimization applied)
        - discount_applied
        - finance_adjusted_ex_gst
        - gst_amount
        - final_inc_gst
        - optimization_occurred
        - optimization_details
        """
        # Ensure minimum
        subtotal_ex_gst = max(subtotal_ex_gst, self.config["minimum_project_price"])
        
        original_bracket = self.get_hum_bracket(subtotal_ex_gst)
        finance_adj_original, _ = self.apply_hum_fee(subtotal_ex_gst)
        
        result = {
            "original_subtotal": subtotal_ex_gst,
            "original_bracket": original_bracket,
            "optimized_subtotal": subtotal_ex_gst,
            "optimized_bracket": original_bracket,
            "discount_applied": 0,
            "optimization_occurred": False,
            "optimization_details": None
        }
        
        # Check optimization opportunity
        if self.config["hum_optimization"]["enabled"]:
            optimization = self._check_optimization_opportunity(
                subtotal_ex_gst,
                original_bracket,
                finance_adj_original
            )
            
            if optimization["should_optimize"]:
                result["optimized_subtotal"] = optimization["optimized_subtotal"]
                result["optimized_bracket"] = optimization["optimized_bracket"]
                result["discount_applied"] = optimization["discount_amount"]
                result["optimization_occurred"] = True
                result["optimization_details"] = optimization["details"]
        
        # Calculate final with optimized subtotal
        final_subtotal = result["optimized_subtotal"]
        finance_adj_final, _ = self.apply_hum_fee(final_subtotal)
        gst_rate = self.config["gst_rate"]
        gst_amount = finance_adj_final * gst_rate
        final_inc_gst = finance_adj_final + gst_amount
        
        result["finance_adjusted_ex_gst"] = finance_adj_final
        result["gst_amount"] = gst_amount
        result["final_inc_gst"] = final_inc_gst
        
        return result
    
    def _check_optimization_opportunity(self, current_subtotal: float, current_bracket: Dict, current_finance_adj: float) -> Dict:
        """
        Check if moving to previous bracket would be beneficial.
        Compare: discount cost vs. merchant fee savings.
        """
        brackets = self.config["hum_brackets"]
        max_discount = self.config["hum_optimization"]["max_discount_allowance"]
        
        # Find previous bracket
        current_bracket_idx = None
        for i, b in enumerate(brackets):
            if b["from"] == current_bracket["from"]:
                current_bracket_idx = i
                break
        
        if current_bracket_idx is None or current_bracket_idx == 0:
            return {"should_optimize": False}
        
        prev_bracket_config = brackets[current_bracket_idx - 1]
        prev_bracket = {
            "from": prev_bracket_config["from"],
            "to": prev_bracket_config["to"],
            "fortnights": prev_bracket_config["fortnights"],
            "fee_percent": prev_bracket_config["fee"],
            "range_desc": f"${prev_bracket_config['from']:,.0f}–${prev_bracket_config['to']:,.0f}"
        }
        
        # Check if we can fit in previous bracket by discounting
        max_in_prev = prev_bracket["to"]
        discount_needed = current_subtotal - max_in_prev
        
        if discount_needed <= 0 or discount_needed > max_discount:
            return {"should_optimize": False}
        
        # Calculate savings
        optimized_subtotal = max_in_prev
        finance_adj_optimized, _ = self.apply_hum_fee(optimized_subtotal)
        
        fee_savings = current_finance_adj - finance_adj_optimized
        net_benefit = fee_savings - discount_needed
        
        if net_benefit >= 0:
            return {
                "should_optimize": True,
                "optimized_subtotal": optimized_subtotal,
                "optimized_bracket": prev_bracket,
                "discount_amount": discount_needed,
                "details": {
                    "reason": "Lower bracket improves margin despite discount",
                    "fee_savings": round(fee_savings, 2),
                    "discount_amount": round(discount_needed, 2),
                    "net_benefit": round(net_benefit, 2)
                }
            }
        
        return {"should_optimize": False}
    
    def calculate_repayments(self, final_price_inc_gst: float, fortnights: int) -> Dict:
        """
        Calculate fortnightly and weekly repayments.
        Returns: {term_weeks, fortnights, fortnightly_amount, weekly_amount}
        """
        term_weeks = fortnights * 2
        fortnightly_amount = final_price_inc_gst / fortnights
        weekly_amount = fortnightly_amount / 2
        
        return {
            "term_weeks": term_weeks,
            "fortnights": fortnights,
            "fortnightly": round(fortnightly_amount, 2),
            "weekly": round(weekly_amount, 2)
        }
    
    def validate_inputs(self, inputs: Dict) -> Tuple[bool, List[str]]:
        """Validate customer inputs before calculation"""
        errors = []
        
        if not inputs.get("name", "").strip():
            errors.append("Name is required")
        if not inputs.get("phone", "").strip():
            errors.append("Phone is required")
        if not inputs.get("email", "").strip():
            errors.append("Email is required")
        elif "@" not in inputs.get("email", ""):
            errors.append("Email must be valid")
        if not inputs.get("suburb", "").strip():
            errors.append("Suburb/postcode is required")
        
        # Area validation
        if inputs.get("has_measurements") == "yes":
            try:
                length = float(inputs.get("length", 0))
                width = float(inputs.get("width", 0))
                if length <= 0 or width <= 0:
                    errors.append("Length and width must be positive")
            except ValueError:
                errors.append("Length and width must be numbers")
        elif inputs.get("has_measurements") == "no":
            if not inputs.get("plan_uploaded"):
                errors.append("Plans required if measurements unknown")
        
        # Finish
        valid_finishes = ["natural_grey", "coloured", "exposed_aggregate", "pavilion_finish"]
        if inputs.get("finish") not in valid_finishes:
            errors.append("Invalid finish selection")
        
        # Photos
        if not inputs.get("photo_count", 0) >= 1:
            errors.append("At least one photo required")
        
        return len(errors) == 0, errors


if __name__ == "__main__":
    engine = PricingEngine()
    
    # Test: 50m² exposed aggregate, flat, no removal, no drain
    finish = "exposed_aggregate"
    area_sqm = 50
    has_removal = False
    slope = "flat_minimal"
    drainage = "no"
    
    base_desc, base_rate = engine.get_base_rate(finish, area_sqm)
    base_cost = base_rate * area_sqm
    
    excavation_desc, excavation_cost = engine.calculate_excavation(area_sqm)
    demolition_desc, demolition_cost = engine.calculate_demolition(area_sqm, has_removal)
    steepness_desc, steepness_cost = engine.calculate_steepness(slope, area_sqm)
    pump_desc, pump_cost = engine.calculate_pump(slope, area_sqm)
    drain_desc, drain_cost = engine.calculate_strip_drain(drainage)
    
    subtotal = base_cost + excavation_cost + demolition_cost + steepness_cost + pump_cost + drain_cost
    
    calc = engine.calculate_with_optimization(subtotal)
    
    print(f"\n=== Test Calculation ===")
    print(f"{base_desc}: {base_rate}/m² × {area_sqm}m² = ${base_cost:,.2f}")
    print(f"{excavation_desc}: ${excavation_cost:,.2f}")
    print(f"{demolition_desc}: ${demolition_cost:,.2f}")
    print(f"{steepness_desc}: ${steepness_cost:,.2f}")
    print(f"{pump_desc}: ${pump_cost:,.2f}")
    print(f"{drain_desc}: ${drain_cost:,.2f}")
    print(f"\nSubtotal (ex GST, ex finance): ${subtotal:,.2f}")
    print(f"Original bracket: ${calc['original_bracket']['range_desc']} @ {calc['original_bracket']['fee_percent']}%")
    
    if calc["optimization_occurred"]:
        print(f"\n*** OPTIMIZED ***")
        print(f"Optimized bracket: ${calc['optimized_bracket']['range_desc']} @ {calc['optimized_bracket']['fee_percent']}%")
        print(f"Discount applied: ${calc['discount_applied']:,.2f}")
        print(f"Fee savings: ${calc['optimization_details']['fee_savings']:,.2f}")
    
    print(f"\nFinance-adjusted (ex GST): ${calc['finance_adjusted_ex_gst']:,.2f}")
    print(f"GST (10%): ${calc['gst_amount']:,.2f}")
    print(f"Final (inc GST): ${calc['final_inc_gst']:,.2f}")
    
    repayment = engine.calculate_repayments(calc['final_inc_gst'], calc['optimized_bracket']['fortnights'])
    print(f"\nRepayment ({repayment['fortnights']} fortnights / {repayment['term_weeks']} weeks):")
    print(f"  Fortnightly: ${repayment['fortnightly']:,.2f}")
    print(f"  Weekly: ${repayment['weekly']:,.2f}")
