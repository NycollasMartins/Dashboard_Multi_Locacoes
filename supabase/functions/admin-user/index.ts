// Edge Function: admin-user
// Ações administrativas sobre usuários. Só admins podem chamar.
//   action = 'delete' -> exclui o usuário permanentemente
//
// (Arquivar/reativar é feito direto no perfil pelo app — não passa por aqui.)
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
    const { action, user_id } = await req.json();
    if (!action || !user_id) {
      return json({ error: "action e user_id são obrigatórios." }, 400);
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
      return json({ error: "Apenas administradores podem gerenciar usuários." }, 403);
    }

    // 3) Impede o admin de agir sobre a própria conta.
    if (user.id === user_id) {
      return json({ error: "Você não pode fazer isso com a sua própria conta." }, 400);
    }

    // 4) Executa a ação.
    if (action === "delete") {
      // Chamada direta à API admin do GoTrue (mais confiável que o SDK aqui).
      const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user_id}`, {
        method: "DELETE",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const body = await res.text();
        return json({ error: `Falha ao excluir (HTTP ${res.status}): ${body}` }, 400);
      }
      return json({ success: true }, 200);
    }

    return json({ error: "Ação inválida." }, 400);
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
