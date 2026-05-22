"use client";

import { useTransition } from "react";
import { logout } from "@/app/auth/actions";

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => logout())}
      disabled={pending}
      className="inline-flex items-center justify-center rounded-xl border border-[#d9cdc2] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--coral)] hover:bg-[#fff5f2] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
