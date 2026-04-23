// Chat input bar at the bottom of the chat area.
// Suggestion chip clicks will fill the input in Milestone 2.

"use client"; // This component uses client-side state for the input value.

import { useState } from "react";

export default function ChatInput() {
  const [value, setValue] = useState("");

  return (
    <div
      style={{
        padding: "16px 24px",
        borderTop: "1px solid #e2e8f0",
        background: "white",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Ask a question about your form..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          style={{
            background: "#E8593C",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "12px 16px",
            cursor: "pointer",
            fontSize: "18px",
          }}
        >
          ↑
        </button>
      </div>
      <p style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
        Responses are grounded in your document. Always verify important
        details.
      </p>
    </div>
  );
}
