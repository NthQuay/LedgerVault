"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businessProfile, businessNumbers, documents, settings } from "@/db/schema";
import { storeUploadedFile } from "@/lib/files";

export async function updateBusinessProfile(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const businessName = String(formData.get("businessName") || "").trim();
  const legalName = String(formData.get("legalName") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;

  if (!businessName) return "Business name is required.";

  try {
    const [existing] = await db.select().from(businessProfile).limit(1);
    if (existing) {
      await db
        .update(businessProfile)
        .set({ businessName, legalName, email, phone, address, updatedAt: new Date() })
        .where(eq(businessProfile.id, existing.id));
    } else {
      await db.insert(businessProfile).values({ businessName, legalName, email, phone, address });
    }
  } catch (error) {
    return error instanceof Error ? error.message : "Something went wrong.";
  }
  revalidatePath("/", "layout");
}

export async function updateFyStartMonth(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const fyStartMonth = Number(formData.get("fyStartMonth"));
  if (!Number.isInteger(fyStartMonth) || fyStartMonth < 1 || fyStartMonth > 12) {
    return "Pick a valid month.";
  }
  try {
    const [existing] = await db.select().from(settings).limit(1);
    if (existing) {
      await db
        .update(settings)
        .set({ fyStartMonth, updatedAt: new Date() })
        .where(eq(settings.id, existing.id));
    } else {
      await db.insert(settings).values({ fyStartMonth });
    }
  } catch (error) {
    return error instanceof Error ? error.message : "Something went wrong.";
  }
  revalidatePath("/", "layout");
}

export async function addBusinessNumber(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const label = String(formData.get("label") || "").trim();
  const value = String(formData.get("value") || "").trim();
  if (!label || !value) return "Both a label and a number are required.";
  try {
    await db.insert(businessNumbers).values({ label, value });
  } catch (error) {
    return error instanceof Error ? error.message : "Something went wrong.";
  }
  revalidatePath("/business");
}

export async function deleteBusinessNumber(id: string) {
  await db.delete(businessNumbers).where(eq(businessNumbers.id, id));
  revalidatePath("/business");
}

export async function addDocument(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "Other");
  const description = String(formData.get("description") || "").trim() || null;
  const expiryRaw = String(formData.get("expiryDate") || "").trim();
  const expiryDate = expiryRaw ? new Date(expiryRaw) : null;
  const file = formData.get("file") as File | null;

  if (!title) return "A title is required.";

  try {
    const fileId = await storeUploadedFile(file);
    await db.insert(documents).values({ title, category, description, expiryDate, fileId });
  } catch (error) {
    return error instanceof Error ? error.message : "Something went wrong.";
  }
  revalidatePath("/business");
}

export async function deleteDocument(id: string) {
  await db.delete(documents).where(eq(documents.id, id));
  revalidatePath("/business");
}
