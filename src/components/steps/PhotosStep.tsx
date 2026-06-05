import { useFormStore } from "@/state/useFormStore";
import { FileUpload } from "@/components/ui/FileUpload";
import { CameraIcon } from "@/components/ui/icons";
import type { StepErrors } from "@/state/useFormStore";

export function PhotosStep({ errors }: { errors: StepErrors }) {
  const { photos, addPhoto, removePhoto } = useFormStore();
  return (
    <div className="form-section">
      <h2>Project Photos</h2>
      <div className="form-group">
        <label className="step-question">Upload at least one photo</label>
        <FileUpload
          kind="photos"
          files={photos}
          onAdd={addPhoto}
          onRemove={removePhoto}
          max={5}
          accept="image/*"
          icon={<CameraIcon />}
          promptLabel="Click to upload photos (JPG, PNG, GIF, WebP)"
          hint="Recommended: street-facing, garage-facing, and side slope views."
          invalid={!!errors.photos}
        />
      </div>
    </div>
  );
}
