// Chat message bubble component.
// Renders AI and user messages differently based on the role prop.

import { Message } from "./messages";

export default function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            background: "#1C2B3A",
            color: "white",
            padding: "12px 16px",
            borderRadius: "16px",
            maxWidth: "75%",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        >
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
      {/* Coral avatar */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "#E8593C",
          flexShrink: 0,
        }}
      />

      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          padding: "12px 16px",
          borderRadius: "16px",
          maxWidth: "75%",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      >
        <p>{message.text}</p>

        {/* Suggestion chips */}
        {message.suggestions && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            {message.suggestions.map((s) => (
              <button
                key={s}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  background: "white",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Citation chip */}
        {message.citation && (
          <div
            style={{
              marginTop: "10px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: "#E8593C",
            }}
          >
            ◉ {message.citation}
          </div>
        )}
      </div>
    </div>
  );
}
