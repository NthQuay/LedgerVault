"use client";

import { useActionState, useState } from "react";
import { parsePastedExpenseLine } from "@/lib/parse-paste";
import { gstFromTotal } from "@/lib/money";

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

type ExpenseAction = (
  prevState: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

export function ExpenseForm({
  action,
  categories,
  initial,
  submitLabel = "Save expense",
}: {
  action: ExpenseAction;
  categories: Category[];
  initial?: Initial;
  submitLabel?: string;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);

  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [taxAmount, setTaxAmount] = useState(initial?.taxAmount ?? "");
  // New expenses default to auto-calculated GST; editing an existing one
  // keeps its stored value untouched unless the user opts back into auto.
  const [gstAuto, setGstAuto] = useState(!initial);
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [pasteText, setPasteText] = useState("");
  const [pasteNote, setPasteNote] = useState<string | undefined>();

  function recalculateTax(amountValue: string) {
    const n = Number(amountValue);
    setTaxAmount(Number.isFinite(n) && n > 0 ? gstFromTotal(n).toFixed(2) : "");
  }

  function handleAmountChange(value: string) {
    setAmount(value);
    if (gstAuto) recalculateTax(value);
  }

  function handleTaxChange(value: string) {
    setTaxAmount(value);
    setGstAuto(false);
  }

  function handleAutoGstToggle() {
    setGstAuto(true);
    recalculateTax(amount);
  }

  function handleFillFromPaste() {
    const parsed = parsePastedExpenseLine(pasteText);
    const foundAnything = Boolean(parsed.date || parsed.amount || parsed.description);
    if (!foundAnything) {
      setPasteNote(
        "Couldn't find enough information in that text — try pasting a full row, or fill in the fields manually.",
      );
      return;
    }

    if (parsed.date) setDate(parsed.date);
    if (parsed.vendor) setVendor(parsed.vendor);
    if (parsed.description) setDescription(parsed.description);
    if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
    if (parsed.notes) setNotes(parsed.notes);
    if (parsed.amount) handleAmountChange(parsed.amount);
    if (parsed.taxAmount) {
      setTaxAmount(parsed.taxAmount);
      setGstAuto(false);
    }

    if (parsed.categoryName) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === parsed.categoryName!.toLowerCase(),
      );
      if (match) {
        setCategoryId(match.id);
        setPasteNote(undefined);
      } else {
        setPasteNote(
          `Category "${parsed.categoryName}" doesn't exist yet — pick one manually, or leave it uncategorised.`,
        );
      }
    } else {
      setPasteNote(undefined);
    }
  }

  return (
    <form action={formAction} className="space-y-4 max-w-xl">
      {!initial && (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-3 space-y-2">
          <label className="block text-sm font-medium">Quick-fill by pasting</label>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={2}
            placeholder="Paste a row copied from your spreadsheet, or just the details (date, vendor, amount...)"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleFillFromPaste}
              className="rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Fill in fields
            </button>
            {pasteNote && <p className="text-xs text-amber-600 dark:text-amber-400">{pasteNote}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            name="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
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
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            name="categoryId"
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value)}
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">Tax/GST amount</label>
            {!gstAuto && (
              <button
                type="button"
                onClick={handleAutoGstToggle}
                className="text-xs text-emerald-600 underline"
              >
                Auto-calculate (10%)
              </button>
            )}
          </div>
          <input
            type="number"
            name="taxAmount"
            step="0.01"
            min="0"
            value={taxAmount}
            onChange={(e) => handleTaxChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
          {gstAuto && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Auto-calculated as 1/11 of the amount (10% GST)
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Payment method</label>
          <input
            type="text"
            name="paymentMethod"
            placeholder="e.g. Business card"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
