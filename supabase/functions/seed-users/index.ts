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

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: string[] = [];

    // List of users to set password "000000"
    const usersToUpdate = [
      "diony", "thaina", "marlene", "mirela", "anabeatriz",
      "analais", "eliane", "iury", "paulo", "mariaantonia",
      "daniela", "leticia", "fernanda"
    ];

    // Get all existing users
    const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 200 });
    const existingUsers = authData?.users || [];

    for (const name of usersToUpdate) {
      const email = `${name}@wemerson.app`;
      const user = existingUsers.find((u: any) => u.email === email);
      if (user) {
        const { error } = await adminClient.auth.admin.updateUserById(user.id, { password: "000000" });
        if (error) {
          results.push(`${email}: error updating password - ${error.message}`);
        } else {
          results.push(`${email}: password set to 000000`);
        }
      } else {
        results.push(`${email}: user not found`);
      }
    }

    // Set wemerson's password to match client-side fallback
    const wemersonUser = existingUsers.find((u: any) => u.email === "wemerson@wemerson.app");
    if (wemersonUser) {
      const { error: wpErr } = await adminClient.auth.admin.updateUserById(wemersonUser.id, { password: "wemerson2025" });
      results.push(wpErr ? `wemerson@wemerson.app: error - ${wpErr.message}` : "wemerson@wemerson.app: password reset, passwordless in UI");
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
