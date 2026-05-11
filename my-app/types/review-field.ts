export type ReviewFieldIcon =
  | "file"
  | "user"
  | "map"
  | "calendar"
  | "money"
  | "alert";

export type ReviewField = {
  key: string;
  label: string;
  value: string;
  icon: ReviewFieldIcon;
};

/** Stored JSON in `documents.ai_extraction`. */
export type AiExtractionPayload = {
  fields: ReviewField[];
  generatedAt: string;
};
