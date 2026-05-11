import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing/LandingPageClient";

export const metadata: Metadata = {
  title: "formly.ai — Understand any government form, in your language",
  description:
    "Upload any government form and get clear, plain language guidance in seconds.",
};

export default function HomePage() {
  return (
    <div className="formly-root">
      <LandingPageClient />
    </div>
  );
}
