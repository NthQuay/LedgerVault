"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businessProfile, businessNumbers, documents, settings } from "@/db/schema";
import { storeUploadedFile } from "@/lib/files";

export async function updateBusinessProfile(formData: FormData) {
  const businessName = String(formData.get("businessName") || "").trim();
  const legalName = String(formData.get("legalName") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;

  if (!businessName) throw new Error("Business name is required.");

  const [existing] = await db.select().from(businessProfile).limit(1);
  if (existing) {
    await db
      .update(businessProfile)
      .set({ businessName, legalName, email, phone, address, updatedAt: new Date() })
      .where(eq(businessProfile.id, existing.id));
  } else {
    await db.insert(businessProfile).values({ businessName, legalName, email, phone, address });
  }
  revalidatePath("/", "layout");
}

export async function updateFyStartMonth(formData: FormData) {
  const fyStartMonth = Number(formData.get("fyStartMonth"));
  if (!Number.isInteger(fyStartMonth) || fyStartMonth < 1 || fyStartMonth > 12) {
    throw new Error("Pick a valid month.");
  }
  const [existing] = await db.select().from(settings).limit(1);
  if (existing) {
    await db
      .update(settings)
      .set({ fyStartMonth, updatedAt: new Date() })
      .where(eq(settings.id, existing.id));
  } else {
    await db.insert(settings).values({ fyStartMonth });
  }
  revalidatePath("/", "layout");
}

export async function addBusinessNumber(formData: FormData) {
  const label = String(formData.get("label") || "").trim();
  const value = String(formData.get("value") || "").trim();
  if (!label || !value) throw new Error("Both a label and a number are required.");
  await db.insert(businessNumbers).values({ label, value });
  revalidatePath("/business");
}

export async function deleteBusinessNumber(id: string) {
  await db.delete(businessNumbers).where(eq(businessNumbers.id, id));
  revalidatePath("/business");
}

export async function addDocument(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "Other");
  const description = String(formData.get("description") || "").trim() || null;
  const expiryRaw = String(formData.get("expiryDate") || "").trim();
  const expiryDate = expiryRaw ? new Date(expiryRaw) : null;
  const file = formData.get("file") as File | null;

  if (!title) throw new Error("A title is required.");

  const fileId = await storeUploadedFile(file);
  await db.insert(documents).values({ title, category, description, expiryDate, fileId });
  revalidatePath("/business");
}

export async function deleteDocument(id: string) {
  await db.delete(documents).where(eq(documents.id, id));
  revalidatePath("/business");
}
