"use client";

import { useActionState } from "react";

type FormAction = (
  prevState: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

export function FormWithError({
  action,
  children,
  className,
}: {
  action: FormAction;
  children: React.ReactNode;
  className?: string;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className={className} aria-busy={pending}>
      {children}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </form>
  );
}
