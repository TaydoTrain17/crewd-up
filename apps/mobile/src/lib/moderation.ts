const bannedWords = ["slur", "hate", "violence"];
const piiRegexes = [/\d{3}-?\d{2}-?\d{4}/, /\d{4} \d{4} \d{4} \d{4}/];

export function quickFilter(input: string) {
  const lower = input.toLowerCase();
  if (bannedWords.some((word) => lower.includes(word))) {
    return { allowed: false, reason: "blocked_keyword" } as const;
  }
  if (piiRegexes.some((regex) => regex.test(lower))) {
    return { allowed: false, reason: "pii_detected" } as const;
  }
  return { allowed: true } as const;
}
