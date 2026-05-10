import type { Metadata } from "next";
import "@/styles/dazl/theme.css";
import "@/styles/dazl/dazl-root.css";

export const metadata: Metadata = {
  title: "DAZL",
  description:
    "Upload any government form and get clear, plain language guidance in your language.",
};

export default function StepLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dazl-root flex min-h-screen flex-col">{children}</div>
  );
}
