import { SourceForm } from "../SourceForm";
import { createIncomeSource } from "../../actions";

export default function NewSourcePage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Add subscriber/client
      </h1>
      <SourceForm action={createIncomeSource} submitLabel="Add" />
    </div>
  );
}
