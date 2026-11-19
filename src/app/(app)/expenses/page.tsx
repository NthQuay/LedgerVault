import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses, expenseCategories } from "@/db/schema";
import { formatMoney, formatDate } from "@/lib/money";
import { getFyStartMonth } from "@/lib/settings";
import { currentFy, fyLabel } from "@/lib/fy";
import { deleteExpense } from "./actions";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const fyStartMonth = await getFyStartMonth();
  const params = await searchParams;
  const nowFy = currentFy(fyStartMonth);
  const selectedFy = params.fy ? Number(params.fy) : nowFy;

  const rows = await db
    .select({
      id: expenses.id,
      date: expenses.date,
      description: expenses.description,
      vendor: expenses.vendor,
      amount: expenses.amount,
      categoryName: expenseCategories.name,
      fileId: expenses.fileId,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(eq(expenses.fy, selectedFy))
    .orderBy(desc(expenses.date));

  const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);
  const fyOptions = [nowFy + 1, nowFy, nowFy - 1, nowFy - 2, nowFy - 3];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Expenses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {rows.length} transactions · total {formatMoney(total)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/expenses/import"
            className="rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Import from spreadsheet
          </Link>
          <Link
            href="/expenses/new"
            className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700"
          >
            + Add expense
          </Link>
        </div>
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {fyOptions.map((fy) => (
          <Link
            key={fy}
            href={`/expenses?fy=${fy}`}
            className={`px-3 py-1.5 rounded-full text-sm ${
              fy === selectedFy
                ? "bg-emerald-600 text-white"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
            }`}
          >
            {fyLabel(fy, fyStartMonth)}
          </Link>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Receipt</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800/60">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(r.date)}</td>
                <td className="px-4 py-3">{r.description}</td>
                <td className="px-4 py-3">{r.vendor || "—"}</td>
                <td className="px-4 py-3">{r.categoryName || "Uncategorised"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatMoney(r.amount)}</td>
                <td className="px-4 py-3">
                  {r.fileId ? (
                    <a href={`/files/${r.fileId}`} target="_blank" className="text-emerald-600 underline">
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link href={`/expenses/${r.id}/edit`} className="text-slate-500 hover:underline mr-3">
                    Edit
                  </Link>
                  <form action={deleteExpense.bind(null, r.id)} className="inline">
                    <button type="submit" className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No expenses recorded for this financial year yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
