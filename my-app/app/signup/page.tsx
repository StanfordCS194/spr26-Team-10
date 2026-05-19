import Link from "next/link";
import AuthShell from "@/app/auth/AuthShell";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Save your forms and pick up where you left off."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--coral)] hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
