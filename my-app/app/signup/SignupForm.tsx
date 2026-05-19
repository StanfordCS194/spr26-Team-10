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

export default function SignupForm() {
  const [state, formAction, pending] = useActionState<
    AuthFormState | undefined,
    FormData
  >(signup, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="fullName" className={labelClass}>
          Full name
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
        <label htmlFor="password" className={labelClass}>
          Password
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
        <p className="mt-1 text-xs text-gray-500">
          At least 8 characters.
        </p>
      </div>

      {state?.error && <p className={errorClass}>{state.error}</p>}
      {state?.message && <p className={successClass}>{state.message}</p>}

      <button type="submit" disabled={pending} className={submitButtonClass}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
