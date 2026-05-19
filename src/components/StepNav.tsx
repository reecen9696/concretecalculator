interface StepNavProps {
  canBack: boolean;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  loading?: boolean;
}

export function StepNav({
  canBack,
  nextLabel,
  onBack,
  onNext,
  nextDisabled,
  loading,
}: StepNavProps) {
  return (
    <div className="flex gap-2 mt-4">
      {canBack && (
        <button type="button" onClick={onBack} disabled={loading}>
          ← Back
        </button>
      )}
      <button type="button" onClick={onNext} disabled={nextDisabled || loading}>
        {loading ? "..." : nextLabel}
      </button>
    </div>
  );
}
