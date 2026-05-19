"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthFormState } from "@/app/auth/actions";
import {
  errorClass,
  inputClass,
  labelClass,
  submitButtonClass,
} from "@/app/auth/form-styles";

type LoginFormProps = {
  redirectTo: string;
  initialError?: string;
};

export default function LoginForm({ redirectTo, initialError }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<
    AuthFormState | undefined,
    FormData
  >(login, initialError ? { error: initialError } : undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-[var(--coral)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>

      {state?.error && <p className={errorClass}>{state.error}</p>}

      <button type="submit" disabled={pending} className={submitButtonClass}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
