import type { Prompt } from "../types";

export type RoundConfig = {
  type: "hot_take" | "callout" | "dare";
  durationSeconds: number;
};

export const ROUND_SEQUENCE: RoundConfig[] = [
  { type: "hot_take", durationSeconds: 90 },
  { type: "callout", durationSeconds: 120 },
  { type: "dare", durationSeconds: 150 },
];

export function getNextRound(currentIndex: number, prompts: Prompt[]): { config: RoundConfig; prompt: Prompt } | null {
  const config = ROUND_SEQUENCE[currentIndex + 1];
  if (!config) return null;
  const prompt = prompts.find((item) => item.type === config.type);
  if (!prompt) {
    throw new Error(`Missing prompt for type ${config.type}`);
  }
  return { config, prompt };
}

export function pickPrompt(prompts: Prompt[], type: Prompt["type"], tags: string[] = []) {
  const filtered = prompts.filter((p) => p.type === type && p.active && tags.every((tag) => p.tags.includes(tag)));
  return filtered[Math.floor(Math.random() * filtered.length)];
}
