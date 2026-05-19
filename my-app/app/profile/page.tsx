import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/profile");
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ?? null;
  const initial = (fullName ?? user.email ?? "?").trim().charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-[var(--cream)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="inline-flex">
            <Image
              src="/formly_nobackground.png"
              alt="formly.ai logo"
              width={140}
              height={112}
              className="h-auto w-[104px] sm:w-[120px]"
              priority
            />
          </Link>
          <LogoutButton />
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--coral)] text-xl font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold text-[var(--navy)] sm:text-3xl">
                {fullName ?? "Your profile"}
              </h1>
              <p className="truncate text-sm text-gray-500 sm:text-base">
                {user.email}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" value={fullName ?? "Not set"} />
            <Field label="Email" value={user.email ?? "—"} />
            <Field
              label="Email verified"
              value={user.email_confirmed_at ? "Yes" : "Pending"}
            />
            <Field label="Member since" value={formatDate(user.created_at)} />
            <Field
              label="Last signed in"
              value={formatDate(user.last_sign_in_at ?? undefined)}
            />
            <Field label="User ID" value={user.id} mono />
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center rounded-xl border border-[#d9cdc2] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--coral)] hover:bg-[#fff5f2]"
            >
              Change password
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--coral)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Back to dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#efe6df] bg-[#fbf8f5] px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd
        className={`mt-1 break-words text-sm text-[var(--navy)] ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
