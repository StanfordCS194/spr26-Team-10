"use client";

import { useActionState } from "react";
import { signup, type AuthFormState } from "@/app/auth/actions";
import {
  errorClass,
  inputClass,
  labelClass,
  submitButtonClass,
  successClass,
} from "@/app/auth/form-styles";
import type { AuthLabels } from "@/lib/auth-labels";

type SignupFormProps = {
  labels: AuthLabels;
};

export default function SignupForm({ labels }: SignupFormProps) {
  const [state, formAction, pending] = useActionState<
    AuthFormState | undefined,
    FormData
  >(signup, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="fullName" className={labelClass}>
          {labels.fullName}
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          className={inputClass}
          placeholder="Jane Doe"
        />
      </div>

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
        <label htmlFor="password" className={labelClass}>
          {labels.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-500">{labels.passwordHint}</p>
      </div>

      {state?.error && <p className={errorClass}>{state.error}</p>}
      {state?.message && <p className={successClass}>{state.message}</p>}

      <button type="submit" disabled={pending} className={submitButtonClass}>
        {pending ? labels.creatingAccount : labels.createAccount}
      </button>
    </form>
  );
}
