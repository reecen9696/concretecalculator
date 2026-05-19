import { useFormStore } from "@/state/useFormStore";
import { TextField } from "@/components/ui/TextField";

export function CustomerDetailsStep({
  errors,
}: {
  errors: Record<string, string>;
}) {
  const { customer, setCustomer } = useFormStore();
  return (
    <div className="flex flex-col gap-3">
      <StepHeader
        title="Your details"
        subtitle="So we know where to send your quote."
      />
      <TextField
        label="Full name"
        name="name"
        autoComplete="name"
        placeholder="Jane Smith"
        value={customer.name}
        onChange={(e) => setCustomer({ name: e.target.value })}
        error={errors.name}
      />
      <TextField
        label="Phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="0412 345 678"
        value={customer.phone}
        onChange={(e) => setCustomer({ phone: e.target.value })}
        error={errors.phone}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="jane@example.com"
        value={customer.email}
        onChange={(e) => setCustomer({ email: e.target.value })}
        error={errors.email}
      />
      <TextField
        label="Suburb / postcode"
        name="suburb"
        autoComplete="address-level2"
        placeholder="Docklands VIC 3008"
        value={customer.suburb}
        onChange={(e) => setCustomer({ suburb: e.target.value })}
        error={errors.suburb}
      />
    </div>
  );
}

export function StepHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-1">
      <h2 className="text-[17px] font-semibold tracking-tight text-ink">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-0.5 text-[12.5px] text-ink-muted leading-snug">
          {subtitle}
        </p>
      )}
    </div>
  );
}
