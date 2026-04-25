import type { UIMessage } from "ai";

export type MessageMeta = {
  suggestions?: string[];
  citation?: string;
  annotations?: {
    tag: string;
    title: string;
    detail: string;
  }[];
};

export const seedMessages: UIMessage[] = [
  {
    id: "seed-1",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "I've analyzed your form! This is Form I-765, the Application for Employment Authorization. I can help you understand what information you need and guide you through each section.",
      },
    ],
  },
  {
    id: "seed-2",
    role: "user",
    parts: [
      {
        type: "text",
        text: "What documents do I need?",
      },
    ],
  },
  {
    id: "seed-3",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "In Part 2, Question 3, you'll need to provide your full legal name as it appears on your passport or birth certificate. This should match your supporting documents exactly. If you've changed your name, include documentation of the name change.",
      },
    ],
  },
];

export const messageMeta: Record<string, MessageMeta> = {
  "seed-1": {
    suggestions: [
      "What documents do I need?",
      "How much is the filing fee?",
      "What goes in Part 2?",
      "When should I submit this?",
    ],
  },
  "seed-3": {
    annotations: [
      {
        tag: "Family Name",
        title: "Last name exactly as on passport",
        detail: "Must match official documents to avoid processing delays",
      },
      {
        tag: "Given Name",
        title: "First name from birth certificate",
        detail: "Legal name required for background checks",
      },
    ],
    citation: "Part 2, Line 3.a–3.c",
  },
};
