import Link from "next/link";
import AuthShell from "@/app/auth/AuthShell";
import LoginForm from "./LoginForm";
import { getAuthLabels } from "@/lib/auth-labels";

type LoginPageProps = {
  searchParams: Promise<{ redirectTo?: string; error?: string; language?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ?? "/profile";
  const labels = getAuthLabels(params.language);
  const isRtl = params.language === "ar";

  return (
    <AuthShell
      title={labels.loginTitle}
      subtitle={labels.loginSubtitle}
      isRtl={isRtl}
      footer={
        <>
          {labels.loginFooterText}{" "}
          <Link
            href={`/signup${params.language ? `?language=${params.language}` : ""}`}
            className="font-semibold text-[var(--coral)] hover:underline"
          >
            {labels.loginFooterLink}
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={redirectTo} initialError={params.error} labels={labels} />
      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">{labels.or}</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <Link
        href={`/step/1${params.language ? `?language=${params.language}` : ""}`}
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        {labels.useAsGuest}
      </Link>
    </AuthShell>
  );
}
