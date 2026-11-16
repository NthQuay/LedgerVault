import bcrypt from "bcryptjs";
import { db } from "../src/db";
import {
  settings,
  businessProfile,
  expenseCategories,
  users,
} from "../src/db/schema";

const DEFAULT_CATEGORIES = [
  "Office Supplies",
  "Software & Subscriptions",
  "Travel",
  "Marketing & Advertising",
  "Professional Fees",
  "Rent & Utilities",
  "Insurance",
  "Bank & Merchant Fees",
  "Equipment",
  "Vehicle",
  "Meals & Entertainment",
  "Other",
];

async function main() {
  const existingSettings = await db.select().from(settings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(settings).values({ fyStartMonth: 7 });
    console.log("Created default settings (FY starts July).");
  }

  const existingProfile = await db.select().from(businessProfile).limit(1);
  if (existingProfile.length === 0) {
    await db.insert(businessProfile).values({ businessName: "My Business" });
    console.log("Created blank business profile.");
  }

  const existingCategories = await db.select().from(expenseCategories);
  const existingNames = new Set(existingCategories.map((c) => c.name));
  const toInsert = DEFAULT_CATEGORIES.filter((name) => !existingNames.has(name)).map(
    (name) => ({ name, isDefault: true }),
  );
  if (toInsert.length > 0) {
    await db.insert(expenseCategories).values(toInsert);
    console.log(`Inserted ${toInsert.length} default expense categories.`);
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 10);
    const { eq } = await import("drizzle-orm");
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length === 0) {
      await db.insert(users).values({ email, passwordHash });
      console.log(`Created login user ${email}.`);
    } else {
      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.email, email));
      console.log(`Updated password for existing user ${email}.`);
    }
  } else {
    console.log(
      "ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping login user creation. Set them in .env.local and re-run `npm run seed` to create your login.",
    );
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
