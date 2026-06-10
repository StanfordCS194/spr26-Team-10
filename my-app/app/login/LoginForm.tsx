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
import type { AuthLabels } from "@/lib/auth-labels";

type LoginFormProps = {
  redirectTo: string;
  initialError?: string;
  labels: AuthLabels;
};

export default function LoginForm({ redirectTo, initialError, labels }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<
    AuthFormState | undefined,
    FormData
  >(login, initialError ? { error: initialError } : undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div>
        <label htmlFor="email" className={labelClass}>
          {labels.email}
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
            {labels.password}
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-[var(--coral)] hover:underline"
          >
            {labels.forgotPassword}
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
        {pending ? labels.signingIn : labels.signIn}
      </button>
    </form>
  );
}
