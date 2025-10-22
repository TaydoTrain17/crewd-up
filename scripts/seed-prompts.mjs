import { createClient } from "@supabase/supabase-js";
import prompts from "../supabase/seeds/prompts.json" assert { type: "json" };

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const client = createClient(url, serviceKey);

async function main() {
  console.log(`Seeding ${prompts.length} prompts...`);
  const { error } = await client.from("prompts").upsert(prompts, { onConflict: "id" });
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log("Prompts seeded ✔");
}

main();
