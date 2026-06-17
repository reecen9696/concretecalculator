/**
 * Solid (filled) icons used in the upload widgets, replacing the previous
 * emoji. They paint with `currentColor`, so the colour is controlled by the
 * surrounding element (white via `.file-upload .icon`).
 */

interface IconProps {
  size?: number;
}

export function CameraIcon({ size = 32 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    </svg>
  );
}

export function DocumentIcon({ size = 32 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" />
    </svg>
  );
}

// --- Estimate-page icons -----------------------------------------------------
// Stroked (outline) icons matching the estimate mockup. They paint with
// `currentColor`, so colour comes from the surrounding element.

function strokeProps(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

export function CheckIcon({ size = 28 }: IconProps) {
  return (
    <svg {...strokeProps(size)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function CalendarIcon({ size = 18 }: IconProps) {
  return (
    <svg {...strokeProps(size)}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function WalletIcon({ size = 22 }: IconProps) {
  return (
    <svg {...strokeProps(size)}>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
      <path d="M21 12a2 2 0 0 0-2-2h-4a2 2 0 0 0 0 4h4a2 2 0 0 0 2-2z" />
    </svg>
  );
}

export function PaperPlaneIcon({ size = 26 }: IconProps) {
  return (
    <svg {...strokeProps(size)}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

export function ShieldCheckIcon({ size = 22 }: IconProps) {
  return (
    <svg {...strokeProps(size)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function ClockIcon({ size = 22 }: IconProps) {
  return (
    <svg {...strokeProps(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function BadgeCheckIcon({ size = 22 }: IconProps) {
  return (
    <svg {...strokeProps(size)}>
      <path d="M9.5 3.3a3 3 0 0 1 5 0 3 3 0 0 1 3.5 1.5 3 3 0 0 1 2.6 4 3 3 0 0 1 0 5.4 3 3 0 0 1-2.6 4 3 3 0 0 1-3.5 1.5 3 3 0 0 1-5 0A3 3 0 0 1 6 18.2a3 3 0 0 1-2.6-4 3 3 0 0 1 0-5.4A3 3 0 0 1 6 4.8a3 3 0 0 1 3.5-1.5Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
