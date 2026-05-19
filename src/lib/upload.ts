/**
 * Client wrapper around @vercel/blob/client `upload`.
 *
 * Returns an UploadedFile suitable for the form store. Throws a friendly
 * error message if the upload endpoint returns one (e.g. missing token in
 * dev, oversize file, disallowed content-type).
 */

import { upload as blobUpload } from "@vercel/blob/client";
import type { UploadedFile } from "@/types/form";

export interface UploadProgress {
  /** 0–100 */
  percent: number;
}

const today = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

export async function uploadFile(
  file: File,
  options: {
    /** Subfolder under `inquiries/{date}/` — typically "plans" or "photos". */
    kind: "plans" | "photos";
    onProgress?: (p: UploadProgress) => void;
  },
): Promise<UploadedFile> {
  const pathname = `inquiries/${today()}/${options.kind}/${file.name}`;
  const result = await blobUpload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/upload-url",
    onUploadProgress: (e) =>
      options.onProgress?.({
        percent: Math.round((e.loaded / e.total) * 100),
      }),
  });
  return {
    url: result.url,
    filename: file.name,
    contentType: file.type,
    size: file.size,
  };
}
