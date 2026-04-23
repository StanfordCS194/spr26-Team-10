import { messages } from "./messages";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import LanguageDropdown from "./LanguageDropdown";

export default function ChatPage() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "260px",
          background: "#e2e8f0",
          flexShrink: 0,
          padding: "16px",
        }}
      >
        <LanguageDropdown />
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          background: "#f8fafc",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </div>
        <ChatInput />
      </div>
    </div>
  );
}
