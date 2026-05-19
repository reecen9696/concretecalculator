import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  /** Per-field error — renders red border + below-field error text. */
  error?: string;
}

/**
 * Flat input matching `input.field` from originalcalc, with inline
 * validation:
 *   - aria-invalid + aria-describedby for assistive tech
 *   - red border on the input
 *   - small red error text below, with a leading ⚠ glyph
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, id, name, ...rest },
  ref,
) {
  const inputId = id ?? `f-${name ?? Math.random().toString(36).slice(2, 8)}`;
  const errId = `${inputId}-err`;
  return (
    <div className="form-group">
      <label htmlFor={inputId}>{label}</label>
      <input
        ref={ref}
        id={inputId}
        name={name}
        className="field"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        {...rest}
      />
      {error ? (
        <p id={errId} className="field-error">
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="form-hint">{hint}</p>
      ) : null}
    </div>
  );
});

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField({ label, hint, error, id, name, ...rest }, ref) {
    const inputId =
      id ?? `f-${name ?? Math.random().toString(36).slice(2, 8)}`;
    const errId = `${inputId}-err`;
    return (
      <div className="form-group">
        <label htmlFor={inputId}>{label}</label>
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          className="field"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
          {...rest}
        />
        {error ? (
          <p id={errId} className="field-error">
            <span>{error}</span>
          </p>
        ) : hint ? (
          <p className="form-hint">{hint}</p>
        ) : null}
      </div>
    );
  },
);
