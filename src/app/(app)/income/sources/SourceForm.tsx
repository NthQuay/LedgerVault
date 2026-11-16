"use client";

import { useActionState } from "react";

type Initial = {
  name?: string;
  type?: string;
  status?: string;
  billingAmount?: string | null;
  billingFrequency?: string | null;
  notes?: string;
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

export function SourceForm({
  action,
  initial,
  submitLabel = "Save",
}: {
  action: (formData: FormData) => Promise<void>;
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
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          name="name"
          required
          defaultValue={initial?.name}
          placeholder="e.g. Jane Smith, or Acme Co"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            name="type"
            defaultValue={initial?.type ?? "subscriber"}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          >
            <option value="subscriber">Subscriber</option>
            <option value="client">Client</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            name="status"
            defaultValue={initial?.status ?? "active"}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Expected billing amount</label>
          <input
            type="number"
            name="billingAmount"
            step="0.01"
            min="0"
            defaultValue={initial?.billingAmount ?? ""}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Billing frequency</label>
          <select
            name="billingFrequency"
            defaultValue={initial?.billingFrequency ?? ""}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          >
            <option value="">—</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="one_off">One-off</option>
          </select>
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
