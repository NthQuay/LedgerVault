import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { businessProfile } from "@/db/schema";
import { signOutAction } from "./sign-out-action";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/income", label: "Income" },
  { href: "/reports", label: "Reports" },
  { href: "/business", label: "Business & Documents" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const [profile] = await db.select().from(businessProfile).limit(1);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-56 md:min-h-screen border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <p className="font-semibold text-slate-900 dark:text-slate-100">LedgerVault</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {profile?.businessName || "My Business"}
          </p>
        </div>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible p-2 gap-1 flex-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
          <span className="truncate">{session?.user?.email}</span>
          <form action={signOutAction}>
            <button type="submit" className="underline hover:text-slate-900 dark:hover:text-slate-100">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-slate-950">{children}</main>
    </div>
  );
}
