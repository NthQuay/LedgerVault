"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { storeUploadedFile } from "@/lib/files";
import { getFyStartMonth } from "@/lib/settings";
import { fyForDate } from "@/lib/fy";

function parseExpenseForm(formData: FormData) {
  const date = new Date(String(formData.get("date")));
  const description = String(formData.get("description") || "").trim();
  const vendor = String(formData.get("vendor") || "").trim() || null;
  const categoryId = String(formData.get("categoryId") || "") || null;
  const amount = String(formData.get("amount") || "0");
  const taxAmountRaw = String(formData.get("taxAmount") || "").trim();
  const taxAmount = taxAmountRaw ? taxAmountRaw : null;
  const paymentMethod = String(formData.get("paymentMethod") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!description) throw new Error("Description is required.");
  if (Number.isNaN(date.getTime())) throw new Error("A valid date is required.");
  if (Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    throw new Error("Amount must be a positive number.");
  }

  return { date, description, vendor, categoryId, amount, taxAmount, paymentMethod, notes };
}

export async function createExpense(formData: FormData) {
  const parsed = parseExpenseForm(formData);
  const fyStartMonth = await getFyStartMonth();
  const fy = fyForDate(parsed.date, fyStartMonth);
  const receipt = formData.get("receipt") as File | null;
  const fileId = await storeUploadedFile(receipt);

  await db.insert(expenses).values({ ...parsed, fy, fileId });
  revalidatePath("/expenses");
  revalidatePath("/");
  redirect("/expenses");
}

export async function updateExpense(id: string, formData: FormData) {
  const parsed = parseExpenseForm(formData);
  const fyStartMonth = await getFyStartMonth();
  const fy = fyForDate(parsed.date, fyStartMonth);
  const receipt = formData.get("receipt") as File | null;
  const newFileId = await storeUploadedFile(receipt);

  await db
    .update(expenses)
    .set({ ...parsed, fy, ...(newFileId ? { fileId: newFileId } : {}) })
    .where(eq(expenses.id, id));
  revalidatePath("/expenses");
  revalidatePath("/");
  redirect("/expenses");
}

export async function deleteExpense(id: string) {
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/expenses");
  revalidatePath("/");
}
