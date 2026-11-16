import Link from "next/link";
import { db } from "@/db";
import { incomeSources } from "@/db/schema";
import { formatMoney } from "@/lib/money";
import { deleteIncomeSource } from "../actions";

const FREQUENCY_LABEL: Record<string, string> = {
  monthly: "/month",
  yearly: "/year",
  one_off: "one-off",
};

export default async function SourcesPage() {
  const sources = await db.select().from(incomeSources).orderBy(incomeSources.name);

  const activeSubscribers = sources.filter(
    (s) => s.status === "active" && s.billingFrequency === "monthly",
  );
  const mrr = activeSubscribers.reduce((sum, s) => sum + Number(s.billingAmount ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Link href="/income" className="text-sm text-slate-500 hover:underline">
          ← Back to income
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Subscribers & clients
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {sources.filter((s) => s.status === "active").length} active · est. MRR {formatMoney(mrr)}
          </p>
        </div>
        <Link
          href="/income/sources/new"
          className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700"
        >
          + Add subscriber/client
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Billing</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800/60">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 capitalize">{s.type}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      s.status === "active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {s.billingAmount
                    ? `${formatMoney(s.billingAmount)} ${FREQUENCY_LABEL[s.billingFrequency ?? ""] ?? ""}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link href={`/income/sources/${s.id}/edit`} className="text-slate-500 hover:underline mr-3">
                    Edit
                  </Link>
                  <form action={deleteIncomeSource.bind(null, s.id)} className="inline">
                    <button type="submit" className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No subscribers or clients yet. Add one to start tracking expected income.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
