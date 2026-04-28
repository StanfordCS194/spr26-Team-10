"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <main className="min-h-screen bg-[var(--cream)] px-4 py-4 sm:px-6 sm:py-6 md:px-8">
      {/* Top right language button */}
      <div className="flex justify-end">
        <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)] shadow-md">
          🌐 🇺🇸 English
        </button>
      </div>

      <section className="mx-auto flex max-w-4xl flex-col items-center pt-6 sm:pt-10">
        {/* Logo */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--coral)] text-4xl text-white shadow-lg"></div>

        {/* Title */}
        <h1 className="text-center text-3xl font-bold text-[var(--navy)] sm:text-5xl">
          Welcome to formly.ai
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-center text-base leading-7 text-gray-500 sm:mt-6 sm:text-xl sm:leading-8">
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
        <div className="mt-8 w-full max-w-2xl rounded-3xl bg-white p-4 shadow-xl sm:mt-14 sm:p-10">
          {step === 1 ? (
            <div className="rounded-3xl border-2 border-dashed border-[#E8D8D1] px-4 py-10 text-center sm:px-10 sm:py-16">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF2EF] text-3xl text-[var(--coral)] sm:h-20 sm:w-20 sm:text-4xl">
                ↑
              </div>

              <h2 className="text-xl font-bold text-[var(--navy)] sm:text-2xl">
                Upload Your Document
              </h2>

              <p className="mx-auto mt-4 max-w-md text-base leading-7 text-gray-500 sm:mt-5 sm:text-lg sm:leading-8">
                Take a photo or upload a PDF of your government form. We accept
                images and PDF files.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-500 sm:mt-8 sm:gap-6">
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
            <div className="rounded-3xl border border-[#E8D8D1] bg-[#fffaf8] p-4 sm:p-6">
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

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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
          <div className="mt-8 flex gap-4 rounded-3xl border border-[#F4D8D2] bg-[#FFF8F6] p-4 sm:gap-5 sm:p-6">
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
