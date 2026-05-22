import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/app/auth/AuthShell";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        "Your reset link is invalid or has expired. Please request a new one.",
      )}`,
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something you haven't used before."
      footer={
        <>
          Changed your mind?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--coral)] hover:underline"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
