import { desc } from "drizzle-orm";
import { db } from "@/db";
import { businessProfile, businessNumbers, documents, settings } from "@/db/schema";
import { documentCategories } from "@/db/schema";
import { formatDate } from "@/lib/money";
import { FormWithError } from "@/components/FormWithError";
import {
  updateBusinessProfile,
  updateFyStartMonth,
  addBusinessNumber,
  deleteBusinessNumber,
  addDocument,
  deleteDocument,
} from "./actions";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function BusinessPage() {
  const [profile] = await db.select().from(businessProfile).limit(1);
  const [settingsRow] = await db.select().from(settings).limit(1);
  const numbers = await db.select().from(businessNumbers).orderBy(businessNumbers.label);
  const docs = await db.select().from(documents).orderBy(desc(documents.createdAt));

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Business & Documents
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Business details, registration numbers, and important documents in one place.
        </p>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Business profile</h2>
        <FormWithError action={updateBusinessProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Trading name</label>
              <input
                name="businessName"
                required
                defaultValue={profile?.businessName}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Legal name</label>
              <input
                name="legalName"
                defaultValue={profile?.legalName ?? ""}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                name="email"
                type="email"
                defaultValue={profile?.email ?? ""}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                name="phone"
                defaultValue={profile?.phone ?? ""}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              name="address"
              rows={2}
              defaultValue={profile?.address ?? ""}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700"
          >
            Save profile
          </button>
        </FormWithError>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-medium text-slate-900 dark:text-slate-100 mb-4">
          Financial year
        </h2>
        <FormWithError action={updateFyStartMonth} className="flex items-end gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Financial year starts in</label>
            <select
              name="fyStartMonth"
              defaultValue={settingsRow?.fyStartMonth ?? 7}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700"
          >
            Save
          </button>
        </FormWithError>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Default is July, for the Australian tax year. All reports and expense/income filters use this.
        </p>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-medium text-slate-900 dark:text-slate-100 mb-4">
          Business numbers
        </h2>
        <ul className="space-y-2 mb-4">
          {numbers.map((n) => (
            <li
              key={n.id}
              className="flex items-center justify-between text-sm border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2"
            >
              <span>
                <span className="font-medium">{n.label}:</span> {n.value}
              </span>
              <form action={deleteBusinessNumber.bind(null, n.id)}>
                <button type="submit" className="text-red-600 hover:underline text-xs">
                  Remove
                </button>
              </form>
            </li>
          ))}
          {numbers.length === 0 && (
            <li className="text-sm text-slate-400">No business numbers added yet.</li>
          )}
        </ul>
        <FormWithError action={addBusinessNumber} className="flex gap-2 flex-wrap">
          <input
            name="label"
            placeholder="e.g. ABN"
            required
            className="flex-1 min-w-[120px] rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
          <input
            name="value"
            placeholder="Number"
            required
            className="flex-1 min-w-[160px] rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Add
          </button>
        </FormWithError>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Documents</h2>
        <ul className="space-y-2 mb-4">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between text-sm border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2"
            >
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {d.category}
                  {d.expiryDate ? ` · expires ${formatDate(d.expiryDate)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {d.fileId && (
                  <a href={`/files/${d.fileId}`} target="_blank" className="text-emerald-600 underline text-xs">
                    View
                  </a>
                )}
                <form action={deleteDocument.bind(null, d.id)}>
                  <button type="submit" className="text-red-600 hover:underline text-xs">
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
          {docs.length === 0 && (
            <li className="text-sm text-slate-400">No documents uploaded yet.</li>
          )}
        </ul>
        <FormWithError action={addDocument} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                name="title"
                placeholder="e.g. Public liability insurance"
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                name="category"
                defaultValue="Other"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
              >
                {documentCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Expiry date (optional)</label>
              <input
                type="date"
                name="expiryDate"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">File (PDF or image)</label>
              <input
                type="file"
                name="file"
                accept="application/pdf,image/*"
                className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 file:text-sm file:font-medium file:px-4 file:py-2 file:cursor-pointer hover:file:bg-slate-200 dark:hover:file:bg-slate-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              name="description"
              rows={2}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Upload document
          </button>
        </FormWithError>
      </section>
    </div>
  );
}
