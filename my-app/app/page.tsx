import type { Metadata } from "next";
import { DazlLandingClient } from "@/components/dazl/landing/DazlLandingClient";

export const metadata: Metadata = {
  title: "DAZL — Understand any government form, in your language",
  description:
    "Upload any government form and get clear, plain language guidance in seconds.",
};

export default function HomePage() {
  return (
    <div className="dazl-root">
      <DazlLandingClient />
    </div>
  );
}
