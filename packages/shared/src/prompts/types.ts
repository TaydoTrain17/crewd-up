export type PromptTag =
  | "nightlife"
  | "subway"
  | "fashion"
  | "finance"
  | "queens"
  | "brooklyn"
  | "manhattan"
  | "bronx"
  | "staten_island"
  | "food"
  | "culture"
  | "dating"
  | "tourist";

export type PromptSeed = {
  text: string;
  type: "hot_take" | "callout" | "dare";
  tags: PromptTag[];
  risk?: number;
  locale?: string;
};
