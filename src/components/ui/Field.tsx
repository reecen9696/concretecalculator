import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  /** Show red border + aria-invalid but no below-field error text. */
  invalid?: boolean;
  /** Renders below-field error text (implies invalid). */
  error?: string;
}

/**
 * Flat input matching `input.field` from originalcalc.
 *
 * Two failure modes:
 *   `invalid` (boolean) — just paints the input red. No text below.
 *   `error`   (string)  — red border + message rendered in the helper
 *                         slot below. Implies invalid.
 *
 * Use `invalid` for required-presence failures (the red border alone
 * tells the user which field is missing). Use `error` when the
 * specific reason matters — currently only the email field, where the
 * customer needs to know whether the field is empty or malformed.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, invalid, error, id, name, ...rest },
  ref,
) {
  const inputId = id ?? `f-${name ?? Math.random().toString(36).slice(2, 8)}`;
  const errId = `${inputId}-err`;
  const isInvalid = invalid || !!error;
  return (
    <div className="field-group">
      <label htmlFor={inputId}>{label}</label>
      <input
        ref={ref}
        id={inputId}
        name={name}
        className="field"
        aria-invalid={isInvalid ? true : undefined}
        aria-describedby={error ? errId : undefined}
        {...rest}
      />
      <div className="field-help">
        {error ? (
          <p id={errId} className="field-error">
            <span>{error}</span>
          </p>
        ) : hint ? (
          <p className="form-hint">{hint}</p>
        ) : null}
      </div>
    </div>
  );
});

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  invalid?: boolean;
  error?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField(
    { label, hint, invalid, error, id, name, ...rest },
    ref,
  ) {
    const inputId =
      id ?? `f-${name ?? Math.random().toString(36).slice(2, 8)}`;
    const errId = `${inputId}-err`;
    const isInvalid = invalid || !!error;
    return (
      <div className="field-group">
        <label htmlFor={inputId}>{label}</label>
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          className="field"
          aria-invalid={isInvalid ? true : undefined}
          aria-describedby={error ? errId : undefined}
          {...rest}
        />
        <div className="field-help">
          {error ? (
            <p id={errId} className="field-error">
              <span>{error}</span>
            </p>
          ) : hint ? (
            <p className="form-hint">{hint}</p>
          ) : null}
        </div>
      </div>
    );
  },
);
