import { db } from "@/db";
import { files } from "@/db/schema";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB - keeps the free 1GB Postgres tier roomy
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export async function storeUploadedFile(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File is larger than 8MB. Please compress it and try again.");
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Unsupported file type. Please upload a PDF or image.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(files)
    .values({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      data: buffer,
    })
    .returning({ id: files.id });
  return row.id;
}
