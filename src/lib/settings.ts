import { db } from "@/db";
import { settings } from "@/db/schema";

export async function getFyStartMonth(): Promise<number> {
  const [row] = await db.select().from(settings).limit(1);
  return row?.fyStartMonth ?? 7;
}
