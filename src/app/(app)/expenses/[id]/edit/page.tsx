import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { expenses, expenseCategories } from "@/db/schema";
import { ExpenseForm } from "../../ExpenseForm";
import { updateExpense } from "../../actions";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [expense] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  if (!expense) notFound();

  const categories = await db
    .select({ id: expenseCategories.id, name: expenseCategories.name })
    .from(expenseCategories)
    .orderBy(expenseCategories.name);

  const boundAction = updateExpense.bind(null, id);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Edit expense
      </h1>
      <ExpenseForm
        action={boundAction}
        categories={categories}
        submitLabel="Save changes"
        initial={{
          date: expense.date.toISOString().slice(0, 10),
          description: expense.description,
          vendor: expense.vendor ?? undefined,
          categoryId: expense.categoryId,
          amount: expense.amount,
          taxAmount: expense.taxAmount,
          paymentMethod: expense.paymentMethod ?? undefined,
          notes: expense.notes ?? undefined,
          fileId: expense.fileId,
        }}
      />
    </div>
  );
}
