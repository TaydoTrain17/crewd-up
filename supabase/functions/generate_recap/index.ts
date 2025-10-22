import { serve } from "https://deno.land/std@0.177.1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  const { session_id } = await req.json();
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const client = createClient(url, key);

  const { data: session, error: sessionError } = await client
    .from("sessions")
    .select(
      "id, room_id, started_at, ended_at, is_practice, rounds:rounds(id, type, prompt:prompts(text)), votes:votes(id, voter, target, text_answer)"
    )
    .eq("id", session_id)
    .single();

  if (sessionError) {
    return new Response(JSON.stringify({ error: sessionError.message }), { status: 400 });
  }

  const highlights = session.votes?.slice(0, 2).map((vote: any) => ({
    voter: vote.voter,
    text: vote.text_answer,
  }));

  const recap = {
    sessionId: session.id,
    winner: session.votes?.[0]?.target ?? session.rounds?.[0]?.prompt?.text ?? "Crew",
    funniest: session.votes?.find((vote: any) => vote.text_answer)?.text_answer ?? "NYC energy",
    highlights,
    practice: session.is_practice ?? false,
  };

  await client.from("recap_cards").insert({
    session_id,
    storage_path: `recaps/${session_id}.json`,
    highlights,
  });

  const url = `https://storage.supabase.local/recaps/${session_id}.png`;

  return new Response(
    JSON.stringify({ recap, url, watermark: session.is_practice ? "Practice" : undefined }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
});
