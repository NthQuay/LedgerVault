import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { incomeEntries, incomeSources } from "@/db/schema";
import { toCsv } from "@/lib/csv";
import { getFyStartMonth } from "@/lib/settings";
import { currentFy, fyLabel } from "@/lib/fy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fyStartMonth = await getFyStartMonth();
  const fy = url.searchParams.get("fy")
    ? Number(url.searchParams.get("fy"))
    : currentFy(fyStartMonth);

  const rows = await db
    .select({
      date: incomeEntries.date,
      description: incomeEntries.description,
      source: incomeSources.name,
      amount: incomeEntries.amount,
      notes: incomeEntries.notes,
    })
    .from(incomeEntries)
    .leftJoin(incomeSources, eq(incomeEntries.sourceId, incomeSources.id))
    .where(eq(incomeEntries.fy, fy))
    .orderBy(desc(incomeEntries.date));

  const csv = toCsv(
    ["Date", "Description", "Source", "Amount", "Notes"],
    rows.map((r) => [
      r.date.toISOString().slice(0, 10),
      r.description,
      r.source ?? "",
      r.amount,
      r.notes ?? "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="income-${fyLabel(fy, fyStartMonth)}.csv"`,
    },
  });
}
