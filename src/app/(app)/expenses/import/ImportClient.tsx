"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseImportFile, commitImport } from "./actions";
import type { ParsedExpenseRow } from "@/lib/expense-import";
import { formatMoney } from "@/lib/money";

export function ImportClient() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedExpenseRow[] | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handlePreview() {
    if (!file) return;
    setError(undefined);
    setResult(undefined);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const res = await parseImportFile(formData);
      if (res.error) {
        setError(res.error);
        setRows(null);
      } else {
        setRows(res.rows ?? []);
        setExcluded(new Set(res.rows?.filter((r) => r.issues.length > 0).map((r) => r.rowNumber)));
      }
    });
  }

  function toggleRow(rowNumber: number, hasIssue: boolean) {
    if (hasIssue) return;
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  }

  function handleConfirm() {
    if (!rows) return;
    const toImport = rows.filter((r) => !excluded.has(r.rowNumber) && r.issues.length === 0);
    setError(undefined);
    startTransition(async () => {
      const res = await commitImport(toImport);
      if (res.error) {
        setError(res.error);
      } else {
        setResult(`Imported ${res.imported} expense${res.imported === 1 ? "" : "s"}.`);
        setRows(null);
        setFile(null);
        router.refresh();
      }
    });
  }

  const includedCount = rows ? rows.filter((r) => !excluded.has(r.rowNumber) && r.issues.length === 0).length : 0;
  const newCategories = rows
    ? [
        ...new Set(
          rows
            .filter((r) => !excluded.has(r.rowNumber) && r.issues.length === 0)
            .map((r) => r.category),
        ),
      ]
    : [];

  return (
    <div>
      <Link href="/expenses" className="text-sm text-slate-500 hover:underline">
        ← Back to expenses
      </Link>

      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-2 mb-6">
        Import expenses from spreadsheet
      </h1>

      {!rows && (
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Spreadsheet (.xlsx, .xls, or .csv)</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 file:text-sm file:font-medium file:px-4 file:py-2 file:cursor-pointer hover:file:bg-slate-200 dark:hover:file:bg-slate-700"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Needs a header row with a &quot;Date&quot; column, plus any of: Company, Expense,
              Reference, Subscription duration, Category, Amount, GST, Total, Method.
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {result && <p className="text-sm text-emerald-600">{result}</p>}
          <button
            type="button"
            onClick={handlePreview}
            disabled={!file || pending}
            className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? "Reading…" : "Preview import"}
          </button>
        </div>
      )}

      {rows && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {rows.length} rows found · {includedCount} will be imported
              {newCategories.length > 0 && (
                <> · will create categories: {newCategories.join(", ")}</>
              )}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRows(null);
                  setFile(null);
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending || includedCount === 0}
                className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700 disabled:opacity-60"
              >
                {pending ? "Importing…" : `Import ${includedCount} expense${includedCount === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Vendor</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Issue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const hasIssue = r.issues.length > 0;
                  const isExcluded = excluded.has(r.rowNumber);
                  return (
                    <tr
                      key={r.rowNumber}
                      className={`border-b border-slate-100 dark:border-slate-800/60 ${
                        hasIssue || isExcluded ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={!isExcluded && !hasIssue}
                          disabled={hasIssue}
                          onChange={() => toggleRow(r.rowNumber, hasIssue)}
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.date ?? "—"}</td>
                      <td className="px-3 py-2">{r.vendor || "—"}</td>
                      <td className="px-3 py-2">{r.description}</td>
                      <td className="px-3 py-2">{r.category}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{formatMoney(r.amount)}</td>
                      <td className="px-3 py-2 text-red-600 text-xs">{r.issues.join("; ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
