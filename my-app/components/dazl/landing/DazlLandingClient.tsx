"use client";

import Link from "next/link";
import { useState } from "react";
import { AppNav } from "@/components/dazl/app-nav/app-nav";
import {
  IconArrowRight,
  IconPlayerPlay,
  IconLock,
  IconEyeOff,
  IconFileCertificate,
  IconAccessible,
  IconUpload,
  IconScan,
  IconMessageCircle,
  IconShieldHeart,
  IconWorld,
} from "@tabler/icons-react";
import styles from "./home.module.css";

const STATS = [
  { num: "47k+", label: "Forms understood by real people", blue: false },
  { num: "20+", label: "Languages supported", blue: true },
  { num: "4.9/5", label: "Average user satisfaction", blue: false },
  { num: "0", label: "Documents stored after your session ends", blue: false },
];

const TRUST = [
  { icon: IconLock, label: "End to end encrypted" },
  { icon: IconEyeOff, label: "No data stored" },
  { icon: IconFileCertificate, label: "All major government forms" },
  { icon: IconAccessible, label: "Built for everyone" },
];

const STEPS = [
  {
    icon: IconUpload,
    num: "Step 01",
    title: "Upload your form",
    desc: "Take a photo or upload a PDF. We accept any government document: tax forms, visa applications, benefits paperwork, and more.",
  },
  {
    icon: IconScan,
    num: "Step 02",
    title: "We read it for you",
    desc: "Our AI reads every field and extracts the key information. You confirm what we found. You are always in control.",
  },
  {
    icon: IconMessageCircle,
    num: "Step 03",
    title: "Ask anything",
    desc: "Ask questions in plain language. We explain every field, deadline, and requirement clearly, and in your language.",
  },
];

const VALUES = [
  {
    icon: IconShieldHeart,
    title: "Privacy first",
    desc: "We never store your documents. Everything is processed in your session and deleted when you're done. Your data is yours.",
  },
  {
    icon: IconAccessible,
    title: "Designed for everyone",
    desc: "Built for elderly users, first-generation immigrants, and anyone who finds government paperwork overwhelming. Clarity is the goal.",
  },
  {
    icon: IconWorld,
    title: "Your language, always",
    desc: "We answer in your language, not the form's language. 20+ languages supported, with more added every month.",
  },
];

const LANGUAGES = [
  "English",
  "Español",
  "中文",
  "한국어",
  "Français",
  "Deutsch",
  "Português",
  "हिन्दी",
  "العربية",
  "Русский",
  "日本語",
  "Tiếng Việt",
  "ภาษาไทย",
  "Filipino",
  "Bahasa",
  "+ more",
];

export function DazlLandingClient() {
  const [activeLang, setActiveLang] = useState<string | null>(null);

  return (
    <div className={styles.page}>
      <AppNav landing />

      <div className={styles.heroWrap}>
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.heroTag}>
              <span className={styles.heroTagDot} />
              <span className={styles.heroTagText}>
                Free to use. Sign up in seconds
              </span>
            </div>
            <h1 className={styles.heroH1}>
              Government forms
              <br />
              shouldn&apos;t be
              <br />
              <em className={styles.heroAccent}>this hard.</em>
            </h1>
            <p className={styles.heroBody}>
              <span className={styles.heroBrand}>
                formly<span className={styles.logoAccent}>.ai</span>
              </span>{" "}
              reads your government forms for you and answers your questions in
              plain language,
              <br />
              in your language. No jargon. No confusion. No stress.
            </p>
            <div className={styles.heroActions}>
              <div className={styles.heroActionButtons}>
                <Link href="/step/1" className={styles.btnHero}>
                  Get started free
                  <IconArrowRight size={14} aria-hidden />
                </Link>
                <a href="#how-it-works" className={styles.btnHeroSec}>
                  <IconPlayerPlay size={13} aria-hidden />
                  See how it works
                </a>
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            {STATS.map((s) => (
              <div
                key={s.num}
                className={`${styles.statCard} ${s.blue ? styles.statCardBlue : ""}`}
              >
                <div className={styles.statNum}>{s.num}</div>
                <div className={styles.statLabel}>{s.label}</div>
                {s.blue ? (
                  <div className={styles.langChips}>
                    {["English", "Español", "中文", "한국어", "Français", "+15"].map(
                      (l) => (
                        <span key={l} className={styles.langChip}>
                          {l}
                        </span>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.trustStrip}>
        {TRUST.map(({ icon: Icon, label }) => (
          <div key={label} className={styles.trustItem}>
            <Icon size={16} aria-hidden />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className={styles.sectionWrap}>
        <section id="how-it-works" className={styles.section}>
          <p className={styles.sectionEyebrow}>How it works</p>
          <h2 className={styles.sectionH2}>
            Three steps.
            <br />
            Zero confusion.
          </h2>
          <div className={styles.stepsGrid}>
            {STEPS.map(({ icon: Icon, num, title, desc }) => (
              <div key={num} className={styles.stepCol}>
                <div className={styles.stepIcon}>
                  <Icon size={20} stroke={1.5} aria-hidden />
                </div>
                <p className={styles.stepNum}>{num}</p>
                <p className={styles.stepTitle}>{title}</p>
                <p className={styles.stepDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.sectionWrap}>
        <section className={styles.sectionNoBorder}>
          <p className={styles.sectionEyebrow}>Our values</p>
          <h2 className={styles.sectionH2}>
            Built with care,
            <br />
            for real people.
          </h2>
          <div className={styles.valuesGrid}>
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className={styles.valueCard}>
                <div className={styles.valueIcon}>
                  <Icon size={22} stroke={1.5} aria-hidden />
                </div>
                <p className={styles.valueTitle}>{title}</p>
                <p className={styles.valueDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.langWrap}>
        <section id="languages" className={styles.langSection}>
          <div>
            <p className={styles.sectionEyebrow}>Languages</p>
            <h2 className={styles.langH2}>
              We speak
              <br />
              your language.
            </h2>
            <p className={styles.langSubtitle}>
              Ask your questions in the language you&apos;re most comfortable
              with.{" "}
              <span className={styles.heroBrand}>
                formly<span className={styles.logoAccent}>.ai</span>
              </span>{" "}
              responds in your language. No translation needed.
            </p>
          </div>
          <div className={styles.langList}>
            {LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                className={`${styles.langBadge} ${activeLang === l ? styles.langBadgeActive : ""}`}
                onClick={() => setActiveLang(activeLang === l ? null : l)}
                aria-pressed={activeLang === l}
              >
                {l}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.ctaWrap}>
        <section className={styles.ctaSection}>
          <h2 className={styles.ctaH2}>
            Ready to understand
            <br />
            your form? <em className={styles.heroAccent}>Let&apos;s go.</em>
          </h2>
          <p className={styles.ctaSub}>
            Free. Private. Takes 30 seconds to sign up. Just upload and ask.
          </p>
          <Link href="/step/1" className={styles.btnCtaLarge}>
            Upload your form
            <IconArrowRight size={16} aria-hidden />
          </Link>
        </section>
      </div>

      <footer id="privacy" className={styles.footer}>
        <div className={styles.footerLogo}>
          formly<span className={styles.logoAccent}>.ai</span>
        </div>
        <div className={styles.footerCopy}>
          © 2026 formly.ai · Privacy · Terms
        </div>
      </footer>
    </div>
  );
}
