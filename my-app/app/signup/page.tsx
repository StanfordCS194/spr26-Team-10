import Link from "next/link";
import AuthShell from "@/app/auth/AuthShell";
import SignupForm from "./SignupForm";
import { getAuthLabels } from "@/lib/auth-labels";

type SignupPageProps = {
  searchParams: Promise<{ language?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const labels = getAuthLabels(params.language);
  const isRtl = params.language === "ar";

  return (
    <AuthShell
      title={labels.signupTitle}
      subtitle={labels.signupSubtitle}
      isRtl={isRtl}
      footer={
        <>
          {labels.signupFooterText}{" "}
          <Link
            href={`/login${params.language ? `?language=${params.language}` : ""}`}
            className="font-semibold text-[var(--coral)] hover:underline"
          >
            {labels.signupFooterLink}
          </Link>
        </>
      }
    >
      <SignupForm labels={labels} />
    </AuthShell>
  );
}
