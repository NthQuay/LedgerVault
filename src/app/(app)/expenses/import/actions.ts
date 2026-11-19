"use server";

import { revalidatePath } from "next/cache";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { expenses, expenseCategories } from "@/db/schema";
import { getFyStartMonth } from "@/lib/settings";
import { fyForDate } from "@/lib/fy";
import { parseExpenseWorkbook, type ParsedExpenseRow } from "@/lib/expense-import";

const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;

export async function parseImportFile(
  formData: FormData,
): Promise<{ error?: string; rows?: ParsedExpenseRow[] }> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Choose a file first." };
  if (file.size > MAX_IMPORT_FILE_BYTES) return { error: "File is too large (max 10MB)." };

  try {
    const buffer = await file.arrayBuffer();
    const { rows, error } = parseExpenseWorkbook(buffer);
    if (error) return { error };
    if (rows.length === 0) return { error: "No rows found to import." };
    return { rows };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not read this file." };
  }
}

export async function commitImport(
  rows: ParsedExpenseRow[],
): Promise<{ error?: string; imported?: number }> {
  const usable = rows.filter((r) => r.date && r.issues.length === 0);
  if (usable.length === 0) return { error: "No valid rows to import." };

  try {
    const fyStartMonth = await getFyStartMonth();

    const categoryNames = [...new Set(usable.map((r) => r.category).filter(Boolean))];
    const existingCategories = categoryNames.length
      ? await db
          .select()
          .from(expenseCategories)
          .where(inArray(expenseCategories.name, categoryNames))
      : [];
    const existingNames = new Set(existingCategories.map((c) => c.name));
    const toCreate = categoryNames.filter((name) => !existingNames.has(name));
    const createdCategories = toCreate.length
      ? await db
          .insert(expenseCategories)
          .values(toCreate.map((name) => ({ name, isDefault: false })))
          .returning()
      : [];
    const categoryIdByName = new Map(
      [...existingCategories, ...createdCategories].map((c) => [c.name, c.id]),
    );

    const values = usable.map((r) => {
      const date = new Date(r.date!);
      return {
        date,
        description: r.description,
        vendor: r.vendor || null,
        categoryId: categoryIdByName.get(r.category) ?? null,
        amount: r.amount,
        taxAmount: r.taxAmount,
        paymentMethod: r.paymentMethod || null,
        notes: r.notes,
        fy: fyForDate(date, fyStartMonth),
      };
    });

    await db.insert(expenses).values(values);

    revalidatePath("/expenses");
    revalidatePath("/");
    return { imported: values.length };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong." };
  }
}
