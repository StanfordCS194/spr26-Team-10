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
      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <Link
        href="/step/1"
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        Use as a guest
      </Link>
    </AuthShell>
  );
}
