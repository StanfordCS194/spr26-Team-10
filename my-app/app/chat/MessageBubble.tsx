import { IconChevronRight, IconSparkles } from "@tabler/icons-react";
import type { ChatUIMessage } from "@/app/api/chat/route";
import type { CitationSource } from "@/lib/citations";
import { messageMeta } from "./messages";
import styles from "./chat-panel.module.css";

function getText(message: ChatUIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export default function MessageBubble({
  message,
  onSuggestionClick,
  citations,
}: {
  message: ChatUIMessage;
  onSuggestionClick?: (value: string) => void;
  citations?: CitationSource[];
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
        {citations && citations.length > 0 ? (
          <div className={styles.citationList}>
            <span className={styles.citationLabel}>
              {citations.length === 1 ? "Source:" : "Sources:"}
            </span>
            {citations.map((c) =>
              c.href ? (
                <a
                  key={c.id ?? c.source}
                  href={c.href}
                  className={styles.citationChip}
                  title={c.snippet}
                >
                  {c.label || c.source}
                </a>
              ) : (
                <span
                  key={c.source}
                  className={styles.citationChip}
                  title={c.snippet}
                >
                  {c.label || c.source}
                </span>
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
