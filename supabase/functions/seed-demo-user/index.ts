import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: existingUsers } =
      await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(
      (u) => u.email === "demo@wellnotes.in"
    );

    if (existing) {
      return new Response(
        JSON.stringify({
          message: "Demo user already exists",
          email: "demo@wellnotes.in",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: "demo@wellnotes.in",
      password: "demo1234",
      email_confirm: true,
      user_metadata: {
        full_name: "Dr. Demo Admin",
        role: "admin",
        hospital_id: "11111111-1111-1111-1111-111111111111",
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: "Dr. Demo Admin",
        role: "admin",
        hospital_id: "11111111-1111-1111-1111-111111111111",
        department: "Administration",
        designation: "Hospital Administrator",
        phone: "+91 9876543210",
      })
      .eq("id", data.user.id);

    if (profileError) {
      return new Response(
        JSON.stringify({
          message: "User created but profile update failed",
          error: profileError.message,
          user_id: data.user.id,
        }),
        {
          status: 207,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Demo user created successfully",
        email: "demo@wellnotes.in",
        user_id: data.user.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
