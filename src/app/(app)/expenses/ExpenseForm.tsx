"use client";

import { useActionState } from "react";

type Category = { id: string; name: string };

type Initial = {
  date?: string;
  description?: string;
  vendor?: string;
  categoryId?: string | null;
  amount?: string;
  taxAmount?: string | null;
  paymentMethod?: string;
  notes?: string;
  fileId?: string | null;
};

async function wrapAction(
  action: (formData: FormData) => Promise<void>,
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await action(formData);
  } catch (error) {
    if (error instanceof Error) return error.message;
    throw error;
  }
}

export function ExpenseForm({
  action,
  categories,
  initial,
  submitLabel = "Save expense",
}: {
  action: (formData: FormData) => Promise<void>;
  categories: Category[];
  initial?: Initial;
  submitLabel?: string;
}) {
  const [error, formAction, pending] = useActionState(
    (prevState: string | undefined, formData: FormData) =>
      wrapAction(action, prevState, formData),
    undefined,
  );

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
          <label className="block text-sm font-medium mb-1">Amount (incl. tax)</label>
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
          placeholder="e.g. Adobe Creative Cloud subscription"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Vendor</label>
          <input
            type="text"
            name="vendor"
            defaultValue={initial?.vendor}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            name="categoryId"
            defaultValue={initial?.categoryId ?? ""}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Uncategorised</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tax/GST amount (optional)</label>
          <input
            type="number"
            name="taxAmount"
            step="0.01"
            min="0"
            defaultValue={initial?.taxAmount ?? ""}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Payment method</label>
          <input
            type="text"
            name="paymentMethod"
            placeholder="e.g. Business card"
            defaultValue={initial?.paymentMethod}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
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
          Receipt / invoice {initial?.fileId ? "(uploading replaces current file)" : "(PDF or image, max 8MB)"}
        </label>
        <input
          type="file"
          name="receipt"
          accept="application/pdf,image/*"
          className="w-full text-sm"
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
