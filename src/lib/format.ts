/**
 * Rounding + currency formatting helpers.
 *
 * Python's `round()` and `f"{x:,.2f}"` use banker's rounding (half-to-even).
 * JS `Math.round` rounds half-up. To stay cent-for-cent identical to the
 * Python reference engine we mirror banker's rounding here.
 */

/** Round to N decimals using banker's rounding (half-to-even), matching Python. */
export function roundHalfEven(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return value;
  const factor = 10 ** decimals;
  const shifted = value * factor;
  const floor = Math.floor(shifted);
  const diff = shifted - floor;

  // Treat very-near-half as exact-half, to absorb float representation noise
  // (e.g. 0.245 stored as 0.24499999999999997).
  const EPS = 1e-9;
  if (Math.abs(diff - 0.5) < EPS) {
    return (floor % 2 === 0 ? floor : floor + 1) / factor;
  }
  if (diff < 0.5) return floor / factor;
  return (floor + 1) / factor;
}

/**
 * Format a number as Australian currency: `$24,856.00`. Always shows cents.
 * Banker's rounding so output matches Python's `f"${x:,.2f}"` to the cent.
 */
export function formatCurrency(amount: number): string {
  const rounded = roundHalfEven(amount, 2);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  const whole = Math.floor(abs);
  const cents = Math.round((abs - whole) * 100); // safe: already rounded to 2dp
  const wholeStr = whole.toLocaleString("en-AU", { useGrouping: true });
  return `${sign}$${wholeStr}.${cents.toString().padStart(2, "0")}`;
}

/** Format without a leading dollar sign — used inside compound strings. */
export function formatNumber(amount: number, decimals = 2): string {
  const rounded = roundHalfEven(amount, decimals);
  return rounded.toLocaleString("en-AU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format a bracket range like `$10,000–$15,000` (no cents, single $). */
export function formatBracketRange(from: number, to: number): string {
  const fmt = (n: number) =>
    `$${Math.floor(n).toLocaleString("en-AU", { useGrouping: true })}`;
  return `${fmt(from)}–${fmt(to)}`;
}
