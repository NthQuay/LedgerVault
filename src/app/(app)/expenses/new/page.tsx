import { db } from "@/db";
import { expenseCategories } from "@/db/schema";
import { ExpenseForm } from "../ExpenseForm";
import { createExpense } from "../actions";

export default async function NewExpensePage() {
  const categories = await db
    .select({ id: expenseCategories.id, name: expenseCategories.name })
    .from(expenseCategories)
    .orderBy(expenseCategories.name);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Add expense
      </h1>
      <ExpenseForm action={createExpense} categories={categories} submitLabel="Add expense" />
    </div>
  );
}
