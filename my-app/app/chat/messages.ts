// Hardcoded message data and types for the chat thread.
// Replace with live API responses in Milestone 2.

export type Message = {
  id: number;
  role: "ai" | "user";
  text: string;
  suggestions?: string[];
  citation?: string;
};

export const messages: Message[] = [
  {
    id: 1,
    role: "ai",
    text: "I've analyzed your form! This is Form I-765, the Application for Employment Authorization. I can help you understand what information you need and guide you through each section.",
    suggestions: [
      "What documents do I need?",
      "How much is the filing fee?",
      "What goes in Part 2?",
      "When should I submit this?",
    ],
  },
  {
    id: 2,
    role: "user",
    text: "What documents do I need?",
  },
  {
    id: 3,
    role: "ai",
    text: "In Part 2, Question 3, you'll need to provide your full legal name as it appears on your passport or birth certificate. This should match your supporting documents exactly.",
    citation: "Part 2, Line 3.a–3.c",
  },
];
