export type PastedExpenseFields = {
  date?: string; // yyyy-mm-dd
  vendor?: string;
  description?: string;
  categoryName?: string;
  amount?: string;
  taxAmount?: string;
  paymentMethod?: string;
  notes?: string;
};

function parseDateToken(token: string): string | undefined {
  const match = token.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) return undefined;
  const [, d, m, y] = match;
  const year = y.length === 2 ? Number(y) + 2000 : Number(y);
  const date = new Date(year, Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}

function parseMoneyToken(token: string): number | undefined {
  const cleaned = token.replace(/[^0-9.]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isNaN(n) ? undefined : n;
}

function splitRow(line: string): string[] {
  return line.includes("\t") ? line.split("\t") : line.split(/ {2,}|,(?=\s*[^\s])/);
}

function buildFromParts(parts: Record<string, string | undefined>): PastedExpenseFields {
  const date = parts.date ? parseDateToken(parts.date) : undefined;
  const totalNum = parts.total ? parseMoneyToken(parts.total) : undefined;
  const amountNum = parts.amount ? parseMoneyToken(parts.amount) : undefined;
  const taxNum = parts.tax ? parseMoneyToken(parts.tax) : undefined;
  const finalAmount = totalNum ?? amountNum;
  const notesParts = [parts.reference, parts.duration].map((p) => p?.trim()).filter(Boolean);
  return {
    date,
    vendor: parts.vendor?.trim() || undefined,
    description: parts.description?.trim() || undefined,
    categoryName: parts.categoryName?.trim() || undefined,
    amount: finalAmount !== undefined ? finalAmount.toFixed(2) : undefined,
    taxAmount: taxNum !== undefined ? taxNum.toFixed(2) : undefined,
    paymentMethod: parts.paymentMethod?.trim() || undefined,
    notes: notesParts.length > 0 ? notesParts.join(" · ") : undefined,
  };
}

function heuristicParse(text: string): PastedExpenseFields {
  let remaining = text;
  let date: string | undefined;
  const dateMatch = remaining.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
  if (dateMatch) {
    date = parseDateToken(dateMatch[1]);
    remaining = remaining.replace(dateMatch[0], " ");
  }

  const moneyMatches = [...remaining.matchAll(/\$?\s?\d[\d,]*\.\d{2}\b/g)].map((m) => m[0]);
  let amount: string | undefined;
  let taxAmount: string | undefined;
  if (moneyMatches.length >= 2) {
    // GST is always smaller than the total it's a component of, regardless
    // of which order they're mentioned in free text - so pick by size, not position.
    const values = moneyMatches
      .map(parseMoneyToken)
      .filter((v): v is number => v !== undefined)
      .sort((a, b) => b - a);
    if (values.length >= 2) {
      amount = values[0].toFixed(2);
      taxAmount = values[1].toFixed(2);
    } else if (values.length === 1) {
      amount = values[0].toFixed(2);
    }
  } else if (moneyMatches.length === 1) {
    const total = parseMoneyToken(moneyMatches[0]);
    if (total !== undefined) amount = total.toFixed(2);
  }
  for (const m of moneyMatches) remaining = remaining.replace(m, " ");

  const description = remaining.replace(/\s+/g, " ").trim() || undefined;

  return { date, description, amount, taxAmount };
}

/**
 * Parses text pasted from a spreadsheet row (or loose free text) into
 * expense fields. Handles, in order of preference:
 *  - a header line + a data line (maps by header name)
 *  - a single tab/column-separated row in the canonical column order this
 *    app's spreadsheet importer uses (Date, Company, Expense, Reference,
 *    Subscription duration, Category, Amount, GST, Total, Method)
 *  - otherwise, a best-effort scan for a date and trailing dollar amount(s)
 */
export function parsePastedExpenseLine(raw: string): PastedExpenseFields {
  const text = raw.trim();
  if (!text) return {};

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length >= 2 && /\bdate\b/i.test(lines[0])) {
    const headers = splitRow(lines[0]).map((h) => h.trim().toLowerCase());
    const values = splitRow(lines[1]);
    const get = (...names: string[]) => {
      const idx = headers.findIndex((h) => names.includes(h));
      return idx !== -1 ? values[idx]?.trim() : undefined;
    };
    return buildFromParts({
      date: get("date"),
      vendor: get("company", "vendor"),
      description: get("expense", "description"),
      reference: get("reference"),
      duration: get("subscription duration", "duration"),
      categoryName: get("category"),
      amount: get("amount"),
      tax: get("gst", "tax"),
      total: get("total"),
      paymentMethod: get("method", "payment method"),
    });
  }

  const cells = splitRow(lines[0]);
  if (cells.length >= 6) {
    const [date, vendor, description, reference, duration, categoryName, amount, tax, total, paymentMethod] =
      cells;
    return buildFromParts({
      date,
      vendor,
      description,
      reference,
      duration,
      categoryName,
      amount,
      tax,
      total,
      paymentMethod,
    });
  }

  return heuristicParse(text);
}
