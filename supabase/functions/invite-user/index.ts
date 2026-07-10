// Edge Function: invite-user
// Convida um novo usuário por e-mail. Só admins podem chamar.
// Deploy:  supabase functions deploy invite-user
//
// Requer os secrets (já existem por padrão no projeto):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, role = "user", full_name = "" } = await req.json();
    if (!email) {
      return json({ error: "E-mail é obrigatório." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1) Identifica quem está chamando (token do usuário logado).
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json({ error: "Não autenticado." }, 401);

    // 2) Confere que o chamador é admin.
    const { data: profile } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return json({ error: "Apenas administradores podem convidar." }, 403);
    }

    // 3) Envia o convite com a service role key.
    const admin = createClient(supabaseUrl, serviceKey);
    const redirectTo = `${new URL(req.url).origin}`;
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { role, full_name },
    });
    if (error) return json({ error: error.message }, 400);

    return json({ success: true, user: data.user }, 200);
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
