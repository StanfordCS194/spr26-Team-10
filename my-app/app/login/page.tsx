import Link from "next/link";
import AuthShell from "@/app/auth/AuthShell";
import LoginForm from "./LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ?? "/profile";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep working on your forms."
      footer={
        <>
          New to formly.ai?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[var(--coral)] hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={redirectTo} initialError={params.error} />
    </AuthShell>
  );
}
