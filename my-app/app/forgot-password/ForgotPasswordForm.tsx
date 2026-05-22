"use client";

import { useActionState } from "react";
import {
  requestPasswordReset,
  type AuthFormState,
} from "@/app/auth/actions";
import {
  errorClass,
  inputClass,
  labelClass,
  submitButtonClass,
  successClass,
} from "@/app/auth/form-styles";

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<
    AuthFormState | undefined,
    FormData
  >(requestPasswordReset, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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

      {state?.error && <p className={errorClass}>{state.error}</p>}
      {state?.message && <p className={successClass}>{state.message}</p>}

      <button type="submit" disabled={pending} className={submitButtonClass}>
        {pending ? "Sending link…" : "Send reset link"}
      </button>
    </form>
  );
}
