"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <main className="min-h-screen bg-[var(--cream)] px-8 py-6">
      {/* Top right language button */}
      <div className="flex justify-end">
        <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)] shadow-md">
          🌐 🇺🇸 English
        </button>
      </div>

      <section className="mx-auto flex max-w-4xl flex-col items-center pt-10">
        {/* Logo */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--coral)] text-4xl text-white shadow-lg"></div>

        {/* Title */}
        <h1 className="text-center text-5xl font-bold text-[var(--navy)]">
          Welcome to formly.ai
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-center text-xl leading-8 text-gray-500">
          Your trusted guide for understanding government documents.
          <br />
          Upload a form to get started.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span
            className={`rounded-full px-3 py-1 font-semibold ${
              step >= 1
                ? "bg-[var(--coral)] text-white"
                : "bg-white text-[var(--navy)]"
            }`}
          >
            1. Upload
          </span>
          <span className="text-gray-400">→</span>
          <span
            className={`rounded-full px-3 py-1 font-semibold ${
              step >= 2
                ? "bg-[var(--coral)] text-white"
                : "bg-white text-[var(--navy)]"
            }`}
          >
            2. Review extraction
          </span>
          <span className="text-gray-400">→</span>
          <span className="rounded-full bg-white px-3 py-1 font-semibold text-[var(--navy)]">
            3. Ask questions
          </span>
        </div>

        {/* Upload card */}
        <div className="mt-14 w-full max-w-2xl rounded-3xl bg-white p-10 shadow-xl">
          {step === 1 ? (
            <div className="rounded-3xl border-2 border-dashed border-[#E8D8D1] px-10 py-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FFF2EF] text-4xl text-[var(--coral)]">
                ↑
              </div>

              <h2 className="text-2xl font-bold text-[var(--navy)]">
                Upload Your Document
              </h2>

              <p className="mx-auto mt-5 max-w-md text-lg leading-8 text-gray-500">
                Take a photo or upload a PDF of your government form. We accept
                images and PDF files.
              </p>

              <div className="mt-8 flex justify-center gap-6 text-sm font-medium text-gray-500">
                <span>🖼️ PNG, JPG</span>
                <span>📄 PDF</span>
                <span>📷 Photo</span>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex rounded-xl bg-[var(--coral)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  Upload and continue
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-[#E8D8D1] bg-[#fffaf8] p-6">
              <h2 className="text-xl font-bold text-[var(--navy)]">
                Review OCR extraction
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Confirm the extracted text before you start chat guidance.
              </p>

              <div className="mt-4 rounded-xl border border-[#efe6df] bg-white p-4 text-sm leading-6 text-gray-700">
                Form I-765. Part 2, Question 3 requests your full legal name as
                shown on your passport or birth certificate.
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-[#d9cdc2] px-4 py-2 text-sm font-semibold text-[var(--navy)]"
                >
                  Back
                </button>
                <button
                  onClick={() => router.push("/chat")}
                  className="rounded-xl bg-[var(--coral)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Confirm and ask questions
                </button>
              </div>
            </div>
          )}

          {/* Privacy section */}
          <div className="mt-8 flex gap-5 rounded-3xl border border-[#F4D8D2] bg-[#FFF8F6] p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--coral)]">
              🔒
            </div>

            <div>
              <h3 className="font-bold text-[var(--navy)]">
                Your Privacy Matters
              </h3>

              <p className="mt-2 leading-6 text-gray-500">
                Your documents are encrypted and processed securely. We do not
                store your information beyond your session.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
