import { describe, expect, it } from "vitest";
import { ROUND_SEQUENCE, getNextRound, pickPrompt } from "./rounds";

const prompts = ROUND_SEQUENCE.map((config, index) => ({
  id: `prompt-${index}`,
  text: `Prompt ${index}`,
  type: config.type,
  tags: ["nightlife"],
  risk: 0,
  locale: "en-US",
  active: true,
}));

describe("rounds", () => {
  it("returns the next round config", () => {
    const next = getNextRound(0, prompts as any);
    expect(next?.config.type).toBe("callout");
  });

  it("picks a prompt by type", () => {
    const prompt = pickPrompt(prompts as any, "hot_take");
    expect(prompt?.type).toBe("hot_take");
  });

  it("sums to roughly six minutes of play", () => {
    const total = ROUND_SEQUENCE.reduce((sum, round) => sum + round.durationSeconds, 0);
    expect(total).toBeGreaterThanOrEqual(350);
    expect(total).toBeLessThanOrEqual(370);
  });
});
