import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { room_code, nickname } = await req.json();
    if (!room_code || !nickname) {
      return new Response(JSON.stringify({ error: "BAD_REQUEST" }), {
        status: 400,
        headers: cors,
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, service);

    const { data: room, error: roomErr } = await admin
      .from("rooms")
      .select("id,status")
      .eq("code", room_code)
      .single();
    if (roomErr || !room) {
      return new Response(JSON.stringify({ error: "ROOM_NOT_FOUND" }), {
        status: 404,
        headers: cors,
      });
    }

    const { count } = await admin
      .from("room_members")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id);
    if ((count ?? 0) >= 6) {
      return new Response(JSON.stringify({ error: "ROOM_FULL" }), {
        status: 409,
        headers: cors,
      });
    }

    const gid = crypto.randomUUID();
    const email = `guest_${gid}@crewdup.local`;
    const { data: created, error: uerr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { is_guest: true },
    });
    if (uerr || !created?.user) {
      return new Response(JSON.stringify({ error: "CREATE_USER_FAILED" }), {
        status: 500,
        headers: cors,
      });
    }

    const userId = created.user.id;
    const p1 = admin.from("profiles").insert({ id: userId, display_name: nickname, is_guest: true });
    const p2 = admin
      .from("room_members")
      .insert({ room_id: room.id, user_id: userId, nickname, role: "player" });
    const [{ error: pErr1 }, { error: pErr2 }] = await Promise.all([p1, p2]);
    if (pErr1 || pErr2) {
      return new Response(JSON.stringify({ error: "MEMBERSHIP_FAILED" }), {
        status: 500,
        headers: cors,
      });
    }

    const { data: sess, error: sErr } = await admin.auth.admin.generateSession({ user_id: userId });
    if (sErr || !sess) {
      return new Response(JSON.stringify({ error: "ISSUE_TOKEN_FAILED" }), {
        status: 500,
        headers: cors,
      });
    }

    return new Response(JSON.stringify(sess), {
      headers: { "Content-Type": "application/json", ...cors },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "SERVER_ERROR", detail: String(e) }), {
      status: 500,
      headers: cors,
    });
  }
});
