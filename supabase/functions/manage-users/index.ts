import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: roleData } = await anonClient.from("user_roles").select("role").eq("user_id", user.id).single();
    if (!roleData || roleData.role !== "editor") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { action } = body;

    if (action === "list_users") {
      const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 200 });
      if (error) throw error;

      const { data: rolesData } = await adminClient.from("user_roles").select("user_id,role");
      const rolesMap = new Map((rolesData || []).map((r: any) => [r.user_id, r]));

      const { data: passwordsData } = await adminClient.from("user_passwords").select("user_id,password");
      const passwordsMap = new Map((passwordsData || []).map((p: any) => [p.user_id, p.password]));

      const users = (data?.users || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        role: rolesMap.get(u.id)?.role || 'readonly',
        display_password: passwordsMap.get(u.id) || null,
      }));
      return new Response(JSON.stringify({ users }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "create_user") {
      const { email, password } = body;
      if (!email || !password) throw new Error("email and password required");

      const { data: newUser, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;

      if (newUser?.user) {
        await adminClient.from("user_roles").insert({ user_id: newUser.user.id, role: "readonly" });
        await adminClient.from("user_passwords").upsert({ user_id: newUser.user.id, password, updated_at: new Date().toISOString() }, { onConflict: "user_id" } as any);
      }

      return new Response(JSON.stringify({ user: { id: newUser?.user?.id, email } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update_password") {
      const { user_id, password } = body;
      if (!user_id || !password) throw new Error("user_id and password required");

      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password });
      if (error) throw error;

      await adminClient.from("user_passwords").upsert({ user_id, password, updated_at: new Date().toISOString() }, { onConflict: "user_id" } as any);

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete_user") {
      const { user_id } = body;
      if (!user_id) throw new Error("user_id required");

      await adminClient.from("tools").update({ criado_por: null }).eq("criado_por", user_id);
      await adminClient.from("tools").update({ atualizado_por: null }).eq("atualizado_por", user_id);

      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      await adminClient.from("user_passwords").delete().eq("user_id", user_id);
      await adminClient.from("notes").delete().eq("user_id", user_id);
      await adminClient.from("tool_favorites").delete().eq("user_id", user_id);
      await adminClient.from("tool_access_logs").delete().eq("user_id", user_id);
      await adminClient.from("admin_action_logs").delete().eq("user_id", user_id);
      await adminClient.from("tool_versions").delete().eq("changed_by", user_id);
      await adminClient.from("knowledge_files").delete().eq("uploaded_by", user_id);

      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) throw new Error(`Error deleting user: ${error.message}`);

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update_role") {
      const { user_id, role } = body;
      if (!user_id || !role) throw new Error("user_id and role required");

      await adminClient.from("user_roles").upsert({ user_id, role }, { onConflict: "user_id" } as any);

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update_email") {
      const { user_id, email } = body;
      if (!user_id || !email) throw new Error("user_id and email required");

      const { error } = await adminClient.auth.admin.updateUserById(user_id, { email, email_confirm: true });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error('manage-users error:', err);
    const message = typeof err?.message === 'string' ? err.message : 'Erro';

    if (message.includes('already been registered')) {
      return new Response(JSON.stringify({ error: 'Já existe um usuário com esse nome' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: message || 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
