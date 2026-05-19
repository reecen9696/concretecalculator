import { useFormStore } from "@/state/useFormStore";

export function RemovalStep({ errors }: { errors: Record<string, string> }) {
  const { hasRemoval, setHasRemoval } = useFormStore();
  return (
    <div>
      <h2>Existing surface</h2>
      <p>Is there a driveway or other surface to remove?</p>
      <label>
        <input
          type="radio"
          name="removal"
          checked={hasRemoval === false}
          onChange={() => setHasRemoval(false)}
        />
        No, new site or clear area
      </label>
      <label>
        <input
          type="radio"
          name="removal"
          checked={hasRemoval === true}
          onChange={() => setHasRemoval(true)}
        />
        Yes, demolition / removal required
      </label>
      {errors.removal && <span data-error>{errors.removal}</span>}
    </div>
  );
}
