import { db } from "@/db";
import { incomeSources } from "@/db/schema";
import { IncomeEntryForm } from "../IncomeEntryForm";
import { createIncomeEntry } from "../actions";

export default async function NewIncomePage() {
  const sources = await db
    .select({ id: incomeSources.id, name: incomeSources.name })
    .from(incomeSources)
    .orderBy(incomeSources.name);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Add income
      </h1>
      <IncomeEntryForm action={createIncomeEntry} sources={sources} submitLabel="Add income" />
    </div>
  );
}
