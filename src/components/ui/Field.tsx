import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  /** Per-field error — renders red border + below-field error text. */
  error?: string;
}

/**
 * Flat input matching `input.field` from originalcalc, with inline
 * validation. The helper slot (error / hint) is absolutely positioned
 * below the input so its presence or absence doesn't shift any sibling
 * fields underneath — important on the multi-input customer step at
 * 510px card height.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, id, name, ...rest },
  ref,
) {
  const inputId = id ?? `f-${name ?? Math.random().toString(36).slice(2, 8)}`;
  const errId = `${inputId}-err`;
  return (
    <div className="field-group">
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
  error?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField({ label, hint, error, id, name, ...rest }, ref) {
    const inputId =
      id ?? `f-${name ?? Math.random().toString(36).slice(2, 8)}`;
    const errId = `${inputId}-err`;
    return (
      <div className="field-group">
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
