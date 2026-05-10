import styles from "./step-sidebar.module.css";

export interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepSidebarProps {
  eyebrow?: string;
  heading: string;
  body: string;
  steps: Step[];
  activeStep: number;
}

export function StepSidebar({
  eyebrow = "Get started",
  heading,
  body,
  steps,
  activeStep,
}: StepSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1
          className={styles.heading}
          dangerouslySetInnerHTML={{ __html: heading }}
        />
        <p className={styles.body}>{body}</p>

        <ol className={styles.stepList}>
          {steps.map((step) => {
            const isActive = step.number === activeStep;
            return (
              <li key={step.number} className={styles.stepRow}>
                <span
                  className={`${styles.badge} ${isActive ? styles.badgeActive : styles.badgeInactive}`}
                >
                  {step.number}
                </span>
                <div>
                  <p
                    className={`${styles.stepTitle} ${!isActive ? styles.stepTitleMuted : ""}`}
                  >
                    {step.title}
                  </p>
                  <p className={styles.stepDesc}>{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
