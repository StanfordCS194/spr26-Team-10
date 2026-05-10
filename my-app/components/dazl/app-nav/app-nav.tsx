import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrowLeft } from "@tabler/icons-react";
import styles from "./app-nav.module.css";

interface AppNavProps {
  /** Show nav links + CTA (landing page mode). Default: false */
  landing?: boolean;
  backLabel?: string;
  backTo?: string;
  /** When not landing: replaces static language control (e.g. LanguageDropdown). */
  rightSlot?: ReactNode;
}

export function AppNav({
  landing = false,
  backLabel,
  backTo = "/",
  rightSlot,
}: AppNavProps) {
  return (
    <nav className={styles.nav}>
      <div className={styles.navLeft}>
        <Link href="/" className={styles.logo}>
          formly<span className={styles.logoAccent}>.ai</span>
        </Link>
        {!landing && backLabel ? (
          <Link href={backTo} className={styles.backLink}>
            <IconArrowLeft size={13} aria-hidden />
            {backLabel}
          </Link>
        ) : null}
      </div>
      {landing ? (
        <div className={styles.navRight}>
          <a href="#how-it-works" className={styles.navLink}>
            How it works
          </a>
          <a href="#languages" className={styles.navLink}>
            Languages
          </a>
          <a href="#privacy" className={styles.navLink}>
            Privacy
          </a>
          <Link href="/step/1" className={styles.navCta}>
            Get started
          </Link>
        </div>
      ) : (
        <div className={styles.navRightSlot}>{rightSlot}</div>
      )}
    </nav>
  );
}
