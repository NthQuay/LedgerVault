import { eq } from "drizzle-orm";
import { db } from "@/db";
import { files } from "@/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [file] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }
  const blob = new Blob([new Uint8Array(file.data)], { type: file.mimeType });
  return new Response(blob, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${file.filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
