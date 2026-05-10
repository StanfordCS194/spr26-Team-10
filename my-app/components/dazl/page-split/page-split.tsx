import styles from "./page-split.module.css";

interface PageSplitProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function PageSplit({ left, right }: PageSplitProps) {
  return (
    <div className={styles.split}>
      <div className={styles.left}>{left}</div>
      <div className={styles.right}>{right}</div>
    </div>
  );
}
