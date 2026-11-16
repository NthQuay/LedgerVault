import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { incomeSources } from "@/db/schema";
import { SourceForm } from "../../SourceForm";
import { updateIncomeSource } from "../../../actions";

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [source] = await db.select().from(incomeSources).where(eq(incomeSources.id, id)).limit(1);
  if (!source) notFound();

  const boundAction = updateIncomeSource.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Edit subscriber/client
      </h1>
      <SourceForm
        action={boundAction}
        submitLabel="Save changes"
        initial={{
          name: source.name,
          type: source.type,
          status: source.status,
          billingAmount: source.billingAmount,
          billingFrequency: source.billingFrequency,
          notes: source.notes ?? undefined,
        }}
      />
    </div>
  );
}
