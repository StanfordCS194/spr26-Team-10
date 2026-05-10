export type MessageMeta = {
  suggestions?: string[];
  citation?: string;
  annotations?: {
    tag: string;
    title: string;
    detail: string;
  }[];
};

/** Optional UI metadata keyed by message id (e.g. suggestions from the model layer). */
export const messageMeta: Record<string, MessageMeta> = {};
