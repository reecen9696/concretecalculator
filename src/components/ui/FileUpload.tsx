import { useRef, useState } from "react";
import { uploadFile } from "@/lib/upload";
import type { UploadedFile } from "@/types/form";

interface FileUploadProps {
  kind: "plans" | "photos";
  files: UploadedFile[];
  onAdd: (file: UploadedFile) => void;
  onRemove: (url: string) => void;
  /** Maximum number of files (originalcalc allowed 5 photos). */
  max?: number;
  accept?: string;
  /** Top-of-widget instruction copy. */
  hint?: string;
  /** Icon shown in the drop zone (kept as an emoji to match originalcalc). */
  icon?: string;
  promptLabel?: string;
  multiple?: boolean;
}

interface PendingItem {
  id: string;
  filename: string;
  percent: number;
  error?: string;
}

export function FileUpload({
  kind,
  files,
  onAdd,
  onRemove,
  max = 5,
  accept = "image/*",
  hint,
  icon = "📸",
  promptLabel = "Click to upload",
  multiple = true,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingItem[]>([]);

  const handleFiles = async (chosen: FileList | null) => {
    if (!chosen) return;
    const list = Array.from(chosen);
    for (const file of list) {
      if (files.length + pending.length >= max) break;
      const id = `${Date.now()}-${file.name}`;
      setPending((p) => [...p, { id, filename: file.name, percent: 0 }]);
      try {
        const uploaded = await uploadFile(file, {
          kind,
          onProgress: ({ percent }) =>
            setPending((p) =>
              p.map((x) => (x.id === id ? { ...x, percent } : x)),
            ),
        });
        onAdd(uploaded);
        setPending((p) => p.filter((x) => x.id !== id));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setPending((p) =>
          p.map((x) => (x.id === id ? { ...x, error: msg } : x)),
        );
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const remaining = max - files.length - pending.length;

  return (
    <div>
      {hint && <p className="form-hint" style={{ marginBottom: 8 }}>{hint}</p>}
      <div
        className="file-upload"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="icon">{icon}</div>
        <div className="text">
          {remaining > 0
            ? `${promptLabel} (up to ${remaining} more)`
            : `Maximum ${max} files reached`}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {(files.length > 0 || pending.length > 0) && (
        <div className="uploaded-files">
          {files.map((f) => (
            <div className="uploaded-file" key={f.url}>
              <span className="file-name" title={f.filename}>
                {f.filename}
              </span>
              <span className="file-status">{formatSize(f.size)}</span>
              <button
                type="button"
                className="file-remove"
                onClick={() => onRemove(f.url)}
                aria-label={`Remove ${f.filename}`}
              >
                Remove
              </button>
            </div>
          ))}
          {pending.map((p) => (
            <div className="uploaded-file" key={p.id}>
              <span className="file-name" title={p.filename}>
                {p.filename}
              </span>
              <span className="file-status">
                {p.error ? p.error : `Uploading ${p.percent}%`}
              </span>
              {p.error && (
                <button
                  type="button"
                  className="file-remove"
                  onClick={() =>
                    setPending((curr) => curr.filter((x) => x.id !== p.id))
                  }
                  aria-label="Dismiss error"
                >
                  Dismiss
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
