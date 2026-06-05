import { useFormStore } from "@/state/useFormStore";
import { Field } from "@/components/ui/Field";
import type { StepErrors } from "@/state/useFormStore";

export function CustomerDetailsStep({ errors }: { errors: StepErrors }) {
  const { customer, setCustomer } = useFormStore();
  return (
    <div className="form-section">
      <h2>Your Details</h2>
      <Field
        label="Full Name"
        name="name"
        autoComplete="name"
        placeholder="John Smith"
        value={customer.name}
        invalid={!!errors.name}
        onChange={(e) => setCustomer({ name: e.target.value })}
      />
      <Field
        label="Phone Number"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="0412 345 678"
        value={customer.phone}
        invalid={!!errors.phone}
        onChange={(e) => setCustomer({ phone: e.target.value })}
      />
      <Field
        label="Email Address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="john@example.com"
        value={customer.email}
        error={errors.email}
        onChange={(e) => setCustomer({ email: e.target.value })}
      />
      <Field
        label="Suburb / Postcode"
        name="suburb"
        autoComplete="address-level2"
        placeholder="Docklands VIC 3008"
        value={customer.suburb}
        invalid={!!errors.suburb}
        onChange={(e) => setCustomer({ suburb: e.target.value })}
      />
    </div>
  );
}
