import { serve } from "https://deno.land/std@0.177.1/http/server.ts";

const banned = ["slur", "ssn", "credit card", "address"];

serve(async (req) => {
  const { input } = await req.json();
  const text = String(input ?? "").toLowerCase();
  let risk = 0;
  const labels: string[] = [];

  for (const word of banned) {
    if (text.includes(word)) {
      risk = Math.max(risk, 80);
      labels.push("blocked_keyword");
    }
  }

  if (/\d{3}-?\d{2}-?\d{4}/.test(text)) {
    risk = Math.max(risk, 90);
    labels.push("pii_ssn");
  }

  if (/\d{4} \d{4} \d{4} \d{4}/.test(text)) {
    risk = Math.max(risk, 95);
    labels.push("pii_card");
  }

  return new Response(JSON.stringify({ risk, labels }), {
    headers: { "Content-Type": "application/json" },
  });
});
