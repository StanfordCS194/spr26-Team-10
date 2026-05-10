import type { UIMessage } from "ai";
import { IconChevronRight, IconSparkles } from "@tabler/icons-react";
import { messageMeta } from "./messages";
import styles from "./chat-dazl.module.css";

function getText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export default function MessageBubble({
  message,
  onSuggestionClick,
}: {
  message: UIMessage;
  onSuggestionClick?: (value: string) => void;
}) {
  const text = getText(message);
  const meta = messageMeta[message.id];

  if (message.role === "user") {
    return (
      <div className={`${styles.bubble} ${styles.bubbleUser}`}>
        <p className={styles.bubbleText}>{text}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
      <div className={styles.bubbleAvatar}>
        <IconSparkles size={11} aria-hidden />
      </div>
      <div className={styles.bubbleAssistantInner}>
        <p className={styles.bubbleText}>{text}</p>

        {meta?.suggestions ? (
          <div className={styles.suggestions}>
            {meta.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className={styles.suggestionBtn}
                onClick={() => onSuggestionClick?.(s)}
              >
                {s}
                <IconChevronRight size={12} aria-hidden />
              </button>
            ))}
          </div>
        ) : null}

        {meta?.annotations ? (
          <div className={styles.annotationStack}>
            {meta.annotations.map((annotation) => (
              <div key={annotation.title} className={styles.annotationCard}>
                <span className={styles.annotationTag}>{annotation.tag}</span>
                <p className={styles.annotationTitle}>{annotation.title}</p>
                <p className={styles.annotationDetail}>{annotation.detail}</p>
              </div>
            ))}
          </div>
        ) : null}

        {meta?.citation ? (
          <div className={styles.citationPill}>Source: {meta.citation}</div>
        ) : null}
      </div>
    </div>
  );
}
