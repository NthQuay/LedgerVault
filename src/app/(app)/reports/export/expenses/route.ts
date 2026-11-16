import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses, expenseCategories } from "@/db/schema";
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
      date: expenses.date,
      description: expenses.description,
      vendor: expenses.vendor,
      category: expenseCategories.name,
      amount: expenses.amount,
      taxAmount: expenses.taxAmount,
      paymentMethod: expenses.paymentMethod,
      notes: expenses.notes,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(eq(expenses.fy, fy))
    .orderBy(desc(expenses.date));

  const csv = toCsv(
    ["Date", "Description", "Vendor", "Category", "Amount", "Tax/GST", "Payment method", "Notes"],
    rows.map((r) => [
      r.date.toISOString().slice(0, 10),
      r.description,
      r.vendor ?? "",
      r.category ?? "Uncategorised",
      r.amount,
      r.taxAmount ?? "",
      r.paymentMethod ?? "",
      r.notes ?? "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expenses-${fyLabel(fy, fyStartMonth)}.csv"`,
    },
  });
}
