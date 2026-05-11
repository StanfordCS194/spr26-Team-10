import type { Metadata } from "next";
import "@/styles/formly/theme.css";
import "@/styles/formly/formly-root.css";

export const metadata: Metadata = {
  title: "formly.ai",
  description:
    "Upload any government form and get clear, plain language guidance in your language.",
};

export default function StepLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="formly-root flex min-h-screen flex-col">{children}</div>
  );
}
