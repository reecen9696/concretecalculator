import { useFormStore } from "@/state/useFormStore";

export function CustomerDetailsStep({
  errors,
}: {
  errors: Record<string, string>;
}) {
  const { customer, setCustomer } = useFormStore();
  return (
    <div>
      <h2>Your details</h2>
      <p>
        <label>
          Full name
          <input
            type="text"
            value={customer.name}
            onChange={(e) => setCustomer({ name: e.target.value })}
            placeholder="Jane Smith"
          />
        </label>
        {errors.name && <span data-error>{errors.name}</span>}
      </p>
      <p>
        <label>
          Phone
          <input
            type="tel"
            value={customer.phone}
            onChange={(e) => setCustomer({ phone: e.target.value })}
            placeholder="0412 345 678"
          />
        </label>
        {errors.phone && <span data-error>{errors.phone}</span>}
      </p>
      <p>
        <label>
          Email
          <input
            type="email"
            value={customer.email}
            onChange={(e) => setCustomer({ email: e.target.value })}
            placeholder="jane@example.com"
          />
        </label>
        {errors.email && <span data-error>{errors.email}</span>}
      </p>
      <p>
        <label>
          Suburb / Postcode
          <input
            type="text"
            value={customer.suburb}
            onChange={(e) => setCustomer({ suburb: e.target.value })}
            placeholder="Docklands VIC 3008"
          />
        </label>
        {errors.suburb && <span data-error>{errors.suburb}</span>}
      </p>
    </div>
  );
}
