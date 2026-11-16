"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { incomeEntries, incomeSources } from "@/db/schema";
import { storeUploadedFile } from "@/lib/files";
import { getFyStartMonth } from "@/lib/settings";
import { fyForDate } from "@/lib/fy";

function parseEntryForm(formData: FormData) {
  const date = new Date(String(formData.get("date")));
  const description = String(formData.get("description") || "").trim();
  const sourceId = String(formData.get("sourceId") || "") || null;
  const amount = String(formData.get("amount") || "0");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!description) throw new Error("Description is required.");
  if (Number.isNaN(date.getTime())) throw new Error("A valid date is required.");
  if (Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    throw new Error("Amount must be a positive number.");
  }

  return { date, description, sourceId, amount, notes };
}

export async function createIncomeEntry(formData: FormData) {
  const parsed = parseEntryForm(formData);
  const fyStartMonth = await getFyStartMonth();
  const fy = fyForDate(parsed.date, fyStartMonth);
  const invoice = formData.get("invoice") as File | null;
  const fileId = await storeUploadedFile(invoice);

  await db.insert(incomeEntries).values({ ...parsed, fy, fileId });
  revalidatePath("/income");
  revalidatePath("/");
  redirect("/income");
}

export async function updateIncomeEntry(id: string, formData: FormData) {
  const parsed = parseEntryForm(formData);
  const fyStartMonth = await getFyStartMonth();
  const fy = fyForDate(parsed.date, fyStartMonth);
  const invoice = formData.get("invoice") as File | null;
  const newFileId = await storeUploadedFile(invoice);

  await db
    .update(incomeEntries)
    .set({ ...parsed, fy, ...(newFileId ? { fileId: newFileId } : {}) })
    .where(eq(incomeEntries.id, id));
  revalidatePath("/income");
  revalidatePath("/");
  redirect("/income");
}

export async function deleteIncomeEntry(id: string) {
  await db.delete(incomeEntries).where(eq(incomeEntries.id, id));
  revalidatePath("/income");
  revalidatePath("/");
}

function parseSourceForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "subscriber");
  const status = String(formData.get("status") || "active");
  const billingAmountRaw = String(formData.get("billingAmount") || "").trim();
  const billingAmount = billingAmountRaw || null;
  const billingFrequency = String(formData.get("billingFrequency") || "") || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!name) throw new Error("Name is required.");

  return { name, type, status, billingAmount, billingFrequency, notes, startedAt: new Date() };
}

export async function createIncomeSource(formData: FormData) {
  const parsed = parseSourceForm(formData);
  await db.insert(incomeSources).values(parsed);
  revalidatePath("/income/sources");
  revalidatePath("/");
  redirect("/income/sources");
}

export async function updateIncomeSource(id: string, formData: FormData) {
  const parsed = parseSourceForm(formData);
  const rest = {
    name: parsed.name,
    type: parsed.type,
    status: parsed.status,
    billingAmount: parsed.billingAmount,
    billingFrequency: parsed.billingFrequency,
    notes: parsed.notes,
  };
  await db.update(incomeSources).set(rest).where(eq(incomeSources.id, id));
  revalidatePath("/income/sources");
  revalidatePath("/");
  redirect("/income/sources");
}

export async function deleteIncomeSource(id: string) {
  await db.delete(incomeSources).where(eq(incomeSources.id, id));
  revalidatePath("/income/sources");
  revalidatePath("/");
}
