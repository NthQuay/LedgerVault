import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { expenses, incomeEntries, incomeSources, documents } from "@/db/schema";
import { formatMoney, formatDate } from "@/lib/money";
import { getFyStartMonth } from "@/lib/settings";
import { currentFy, fyLabel } from "@/lib/fy";

export default async function DashboardPage() {
  const fyStartMonth = await getFyStartMonth();
  const fy = currentFy(fyStartMonth);

  const [{ totalExpenses }] = await db
    .select({ totalExpenses: sql<string>`coalesce(sum(${expenses.amount}), 0)` })
    .from(expenses)
    .where(eq(expenses.fy, fy));

  const [{ totalIncome }] = await db
    .select({ totalIncome: sql<string>`coalesce(sum(${incomeEntries.amount}), 0)` })
    .from(incomeEntries)
    .where(eq(incomeEntries.fy, fy));

  const netProfit = Number(totalIncome) - Number(totalExpenses);

  const recentExpenses = await db
    .select({
      id: expenses.id,
      date: expenses.date,
      description: expenses.description,
      amount: expenses.amount,
    })
    .from(expenses)
    .orderBy(desc(expenses.date))
    .limit(5);

  const recentIncome = await db
    .select({
      id: incomeEntries.id,
      date: incomeEntries.date,
      description: incomeEntries.description,
      amount: incomeEntries.amount,
    })
    .from(incomeEntries)
    .orderBy(desc(incomeEntries.date))
    .limit(5);

  const recent = [
    ...recentExpenses.map((e) => ({ ...e, kind: "expense" as const })),
    ...recentIncome.map((i) => ({ ...i, kind: "income" as const })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  const sources = await db.select().from(incomeSources);
  const activeCount = sources.filter((s) => s.status === "active").length;
  const mrr = sources
    .filter((s) => s.status === "active" && s.billingFrequency === "monthly")
    .reduce((sum, s) => sum + Number(s.billingAmount ?? 0), 0);

  const upcomingDocs = await db
    .select()
    .from(documents)
    .where(sql`${documents.expiryDate} is not null and ${documents.expiryDate} < now() + interval '60 days'`)
    .orderBy(documents.expiryDate);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {fyLabel(fy, fyStartMonth)} to date
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/expenses/new"
            className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700"
          >
            + Expense
          </Link>
          <Link
            href="/income/new"
            className="rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            + Income
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Income (FY)" value={formatMoney(totalIncome)} tone="emerald" />
        <Stat label="Expenses (FY)" value={formatMoney(totalExpenses)} tone="red" />
        <Stat
          label="Net profit (FY)"
          value={formatMoney(netProfit)}
          tone={netProfit >= 0 ? "emerald" : "red"}
        />
        <Stat
          label="Active subscribers/clients"
          value={`${activeCount}`}
          sub={mrr > 0 ? `${formatMoney(mrr)} est. MRR` : undefined}
        />
      </div>

      {upcomingDocs.length > 0 && (
        <div className="mb-8 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
            Documents expiring soon
          </p>
          <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-0.5">
            {upcomingDocs.map((d) => (
              <li key={d.id}>
                {d.title} — expires {d.expiryDate ? formatDate(d.expiryDate) : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-medium text-slate-900 dark:text-slate-100">Recent activity</h2>
          <div className="flex gap-3 text-sm">
            <Link href="/expenses" className="text-slate-500 hover:underline">
              All expenses
            </Link>
            <Link href="/income" className="text-slate-500 hover:underline">
              All income
            </Link>
          </div>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {recent.map((r) => (
            <li key={`${r.kind}-${r.id}`} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <p className="text-slate-900 dark:text-slate-100">{r.description}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(r.date)}</p>
              </div>
              <span
                className={r.kind === "income" ? "text-emerald-600" : "text-red-600"}
              >
                {r.kind === "income" ? "+" : "-"}
                {formatMoney(r.amount)}
              </span>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="px-4 py-8 text-center text-slate-400 text-sm">
              Nothing recorded yet. Add your first expense or income entry to get started.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "red";
  sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`text-2xl font-semibold mt-1 ${
          tone === "emerald"
            ? "text-emerald-600"
            : tone === "red"
              ? "text-red-600"
              : "text-slate-900 dark:text-slate-100"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
