import type { ReactNode } from "react";

interface RadioRowProps {
  selected: boolean;
  onSelect: () => void;
  name: string;
  value: string;
  /** Single-line option (e.g. "Yes, water pools at garage"). */
  label?: string;
  /** Optional bolded title — pair with `sub` for two-line radio rows. */
  title?: string;
  sub?: ReactNode;
}

/**
 * Flat bordered radio row — matches `.radio-option` from
 * originalcalc/frontend/index.html. Hover lifts the border to orange,
 * the selected option's label text turns orange + bold.
 */
export function RadioRow({
  selected,
  onSelect,
  name,
  value,
  label,
  title,
  sub,
}: RadioRowProps) {
  const id = `${name}-${value}`;
  return (
    <label
      htmlFor={id}
      className={`radio-row${selected ? " selected" : ""}`}
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
      />
      <span className="label-body">
        {title ? (
          <>
            <strong>{title}</strong>
            {sub && <small>{sub}</small>}
          </>
        ) : (
          label
        )}
      </span>
    </label>
  );
}
