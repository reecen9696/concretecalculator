import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

/** Flat input matching `input.field` from the original stylesheet. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, id, name, ...rest },
  ref,
) {
  const inputId = id ?? `f-${name ?? Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="form-group">
      <label htmlFor={inputId}>{label}</label>
      <input ref={ref} id={inputId} name={name} className="field" {...rest} />
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );
});

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField({ label, hint, id, name, ...rest }, ref) {
    const inputId =
      id ?? `f-${name ?? Math.random().toString(36).slice(2, 8)}`;
    return (
      <div className="form-group">
        <label htmlFor={inputId}>{label}</label>
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          className="field"
          {...rest}
        />
        {hint && <p className="form-hint">{hint}</p>}
      </div>
    );
  },
);
