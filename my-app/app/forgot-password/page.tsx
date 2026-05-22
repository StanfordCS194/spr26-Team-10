import Link from "next/link";
import AuthShell from "@/app/auth/AuthShell";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email tied to your account and we'll send a reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--coral)] hover:underline"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
