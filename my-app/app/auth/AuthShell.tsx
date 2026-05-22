import Image from "next/image";
import Link from "next/link";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[var(--cream)] px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <Link href="/" className="mb-6 inline-flex">
          <Image
            src="/formly_nobackground.png"
            alt="formly.ai logo"
            width={160}
            height={128}
            className="h-auto w-[120px] sm:w-[140px]"
            priority
          />
        </Link>

        <div className="w-full rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-center text-2xl font-semibold text-[var(--navy)] sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-center text-sm leading-6 text-gray-500 sm:text-base">
              {subtitle}
            </p>
          )}

          <div className="mt-6">{children}</div>
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-gray-500">{footer}</div>
        )}
      </div>
    </main>
  );
}
