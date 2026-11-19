import * as XLSX from "xlsx";

export type ParsedExpenseRow = {
  rowNumber: number;
  date: string | null; // ISO yyyy-mm-dd
  vendor: string;
  description: string;
  category: string;
  amount: string; // decimal string, incl. tax
  taxAmount: string | null;
  paymentMethod: string;
  notes: string | null;
  issues: string[];
};

const HEADER_ALIASES: Record<string, string[]> = {
  date: ["date"],
  vendor: ["company", "vendor", "payee", "supplier"],
  description: ["expense", "description", "item"],
  reference: ["reference", "invoice", "receipt"],
  duration: ["subscription duration", "duration", "frequency"],
  category: ["category"],
  amount: ["amount"],
  tax: ["gst", "tax", "vat"],
  total: ["total"],
  method: ["method", "payment method", "paid via"],
};

function normalizeHeader(h: unknown): string {
  return String(h ?? "").trim().toLowerCase();
}

function excelSerialToDate(value: number): Date {
  const utcDays = Math.floor(value - 25569);
  return new Date(utcDays * 86400 * 1000);
}

function parseCellDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") return excelSerialToDate(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (match) {
      const [, d, m, y] = match;
      const year = y.length === 2 ? Number(y) + 2000 : Number(y);
      const date = new Date(year, Number(m) - 1, Number(d));
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function parseCellNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export function parseExpenseWorkbook(buffer: ArrayBuffer): {
  rows: ParsedExpenseRow[];
  error?: string;
} {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  } catch {
    return {
      rows: [],
      error: "Could not read this file. Make sure it's a .xlsx, .xls, or .csv file.",
    };
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) return { rows: [], error: "The file has no sheets." };

  let grid: unknown[][];
  try {
    grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
  } catch {
    return { rows: [], error: "Could not read the spreadsheet contents." };
  }

  let headerRowIndex = -1;
  const columnMap: Record<string, number> = {};
  for (let i = 0; i < Math.min(grid.length, 10); i++) {
    const row = grid[i] ?? [];
    const normalized = row.map(normalizeHeader);
    if (normalized.includes("date")) {
      headerRowIndex = i;
      for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
        const idx = normalized.findIndex((h) => aliases.includes(h));
        if (idx !== -1) columnMap[field] = idx;
      }
      break;
    }
  }
  if (headerRowIndex === -1) {
    return { rows: [], error: "Couldn't find a 'Date' column header in the file." };
  }

  const get = (row: unknown[], field: string) =>
    columnMap[field] !== undefined ? row[columnMap[field]] : null;

  // When several line items share one receipt (e.g. two fees on one
  // invoice), spreadsheets often show this as merged Date/Company/Reference
  // cells. Exported to plain values, only the first row of that merge keeps
  // those values - the rest are blank. Carry the last-seen value down so
  // those continuation rows aren't wrongly flagged as missing a date.
  let lastDate: Date | null = null;
  let lastVendor = "";
  let lastReference = "";

  const rows: ParsedExpenseRow[] = [];
  for (let i = headerRowIndex + 1; i < grid.length; i++) {
    const raw = grid[i] ?? [];

    let dateValue = parseCellDate(get(raw, "date"));
    const description = String(get(raw, "description") ?? "").trim();
    let vendor = String(get(raw, "vendor") ?? "").trim();

    if (!dateValue && !description && !vendor) continue; // blank/trailing row

    if (!dateValue && lastDate) dateValue = lastDate;
    if (!vendor && lastVendor) vendor = lastVendor;

    const category = String(get(raw, "category") ?? "").trim();
    let reference = String(get(raw, "reference") ?? "").trim();
    if (!reference && lastReference) reference = lastReference;
    const duration = String(get(raw, "duration") ?? "").trim();
    const method = String(get(raw, "method") ?? "").trim();

    if (dateValue) lastDate = dateValue;
    if (vendor) lastVendor = vendor;
    if (reference) lastReference = reference;

    const totalValue = parseCellNumber(get(raw, "total"));
    const amountValue = parseCellNumber(get(raw, "amount"));
    const taxValue = parseCellNumber(get(raw, "tax"));
    const finalAmount = totalValue ?? amountValue;

    const issues: string[] = [];
    if (!dateValue) issues.push("Missing or unreadable date");
    if (finalAmount === null || finalAmount <= 0) issues.push("Missing or invalid amount");

    const notesParts = [reference, duration].filter(Boolean);

    rows.push({
      rowNumber: i + 1,
      date: dateValue ? dateValue.toISOString().slice(0, 10) : null,
      vendor,
      description: description || vendor || "Imported expense",
      category: category || "Other",
      amount: finalAmount !== null ? finalAmount.toFixed(2) : "0.00",
      taxAmount: taxValue !== null ? taxValue.toFixed(2) : null,
      paymentMethod: method,
      notes: notesParts.length > 0 ? notesParts.join(" · ") : null,
      issues,
    });
  }

  return { rows };
}
