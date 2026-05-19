"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
  message?: string;
};

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Only allow redirects that stay on this origin. Anything that doesn't look
 * like a local path (`/profile`, `/step/3?id=…`) is rejected so a crafted
 * `?redirectTo=https://evil.com` cannot send the user off-site.
 */
function safeRedirectPath(
  candidate: string | null | undefined,
  fallback: string,
): string {
  if (!candidate) return fallback;
  // Must start with a single "/" and not "//" (which is a protocol-relative URL)
  // and must not contain a scheme like "http:" / "javascript:".
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.startsWith("/\\")
  ) {
    return fallback;
  }
  return candidate;
}

async function getOrigin(): Promise<string> {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin) return origin;

  const host = headerStore.get("host") ?? "localhost:3000";
  const proto =
    headerStore.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function login(
  _prevState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const redirectTo = safeRedirectPath(
    readString(formData, "redirectTo"),
    "/profile",
  );

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signup(
  _prevState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const fullName = readString(formData, "fullName");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      emailRedirectTo: `${origin}/auth/confirm?next=/profile`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // When email confirmation is enabled in Supabase, no session is returned and
  // the user must verify via email. Otherwise we already have a session and
  // can send them straight to their profile.
  if (!data.session) {
    return {
      message:
        "Check your email for a confirmation link to finish signing up.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

export async function requestPasswordReset(
  _prevState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email");

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    message:
      "If an account exists for that email, a reset link is on its way.",
  };
}

export async function updatePassword(
  _prevState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const password = readString(formData, "password");
  const confirm = readString(formData, "confirmPassword");

  if (!password || !confirm) {
    return { error: "Please fill out both password fields." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Your reset link is invalid or has expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
