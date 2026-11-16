import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { expenses, expenseCategories, incomeEntries } from "@/db/schema";
import { formatMoney } from "@/lib/money";
import { getFyStartMonth } from "@/lib/settings";
import { currentFy, fyLabel, fyRange } from "@/lib/fy";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string }>;
}) {
  const fyStartMonth = await getFyStartMonth();
  const params = await searchParams;
  const nowFy = currentFy(fyStartMonth);
  const selectedFy = params.fy ? Number(params.fy) : nowFy;
  const { start, end } = fyRange(selectedFy, fyStartMonth);

  const categoryBreakdown = await db
    .select({
      category: expenseCategories.name,
      total: sql<string>`sum(${expenses.amount})`,
      count: sql<number>`count(*)`,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(eq(expenses.fy, selectedFy))
    .groupBy(expenseCategories.name)
    .orderBy(sql`sum(${expenses.amount}) desc`);

  const [{ totalIncome }] = await db
    .select({ totalIncome: sql<string>`coalesce(sum(${incomeEntries.amount}), 0)` })
    .from(incomeEntries)
    .where(eq(incomeEntries.fy, selectedFy));

  const totalExpenses = categoryBreakdown.reduce((sum, c) => sum + Number(c.total), 0);
  const netProfit = Number(totalIncome) - totalExpenses;
  const fyOptions = [nowFy + 1, nowFy, nowFy - 1, nowFy - 2, nowFy - 3];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {fyLabel(selectedFy, fyStartMonth)} report
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {start.toLocaleDateString("en-AU")} – {new Date(end.getTime() - 86400000).toLocaleDateString("en-AU")}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/reports/export/expenses?fy=${selectedFy}`}
            className="rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Export expenses (CSV)
          </a>
          <a
            href={`/reports/export/income?fy=${selectedFy}`}
            className="rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Export income (CSV)
          </a>
        </div>
      </div>

      <div className="flex gap-1 mb-6 flex-wrap">
        {fyOptions.map((fy) => (
          <Link
            key={fy}
            href={`/reports?fy=${fy}`}
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Income" value={formatMoney(totalIncome)} tone="emerald" />
        <SummaryCard label="Expenses" value={formatMoney(totalExpenses)} tone="red" />
        <SummaryCard
          label="Net profit"
          value={formatMoney(netProfit)}
          tone={netProfit >= 0 ? "emerald" : "red"}
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-3">Expense category</th>
              <th className="px-4 py-3 text-right">Transactions</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {categoryBreakdown.map((c) => (
              <tr key={c.category ?? "uncategorised"} className="border-b border-slate-100 dark:border-slate-800/60">
                <td className="px-4 py-3">{c.category || "Uncategorised"}</td>
                <td className="px-4 py-3 text-right">{c.count}</td>
                <td className="px-4 py-3 text-right">{formatMoney(c.total)}</td>
              </tr>
            ))}
            {categoryBreakdown.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  No expenses recorded for this financial year.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "red";
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`text-2xl font-semibold mt-1 ${
          tone === "emerald" ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
