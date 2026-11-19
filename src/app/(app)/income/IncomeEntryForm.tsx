"use client";

import { useActionState } from "react";

type Source = { id: string; name: string };

type Initial = {
  date?: string;
  description?: string;
  sourceId?: string | null;
  amount?: string;
  notes?: string;
  fileId?: string | null;
};

type IncomeAction = (
  prevState: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

export function IncomeEntryForm({
  action,
  sources,
  initial,
  submitLabel = "Save income",
}: {
  action: IncomeAction;
  sources: Source[];
  initial?: Initial;
  submitLabel?: string;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            name="date"
            required
            defaultValue={initial?.date ?? new Date().toISOString().slice(0, 10)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0.01"
            required
            defaultValue={initial?.amount}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <input
          type="text"
          name="description"
          required
          defaultValue={initial?.description}
          placeholder="e.g. Monthly subscription payment"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Source (optional)</label>
        <select
          name="sourceId"
          defaultValue={initial?.sourceId ?? ""}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        >
          <option value="">None / one-off</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={initial?.notes}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Invoice sent (optional) {initial?.fileId && "(uploading replaces current file)"}
        </label>
        <input
          type="file"
          name="invoice"
          accept="application/pdf,image/*"
          className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 file:text-sm file:font-medium file:px-4 file:py-2 file:cursor-pointer hover:file:bg-slate-200 dark:hover:file:bg-slate-700"
        />
        {initial?.fileId && (
          <a
            href={`/files/${initial.fileId}`}
            target="_blank"
            className="inline-block mt-1 text-sm text-emerald-600 underline"
          >
            View current attachment
          </a>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
