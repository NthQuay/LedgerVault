import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { incomeEntries, incomeSources } from "@/db/schema";
import { IncomeEntryForm } from "../../IncomeEntryForm";
import { updateIncomeEntry } from "../../actions";

export default async function EditIncomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entry] = await db.select().from(incomeEntries).where(eq(incomeEntries.id, id)).limit(1);
  if (!entry) notFound();

  const sources = await db
    .select({ id: incomeSources.id, name: incomeSources.name })
    .from(incomeSources)
    .orderBy(incomeSources.name);

  const boundAction = updateIncomeEntry.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Edit income
      </h1>
      <IncomeEntryForm
        action={boundAction}
        sources={sources}
        submitLabel="Save changes"
        initial={{
          date: entry.date.toISOString().slice(0, 10),
          description: entry.description,
          sourceId: entry.sourceId,
          amount: entry.amount,
          notes: entry.notes ?? undefined,
          fileId: entry.fileId,
        }}
      />
    </div>
  );
}
