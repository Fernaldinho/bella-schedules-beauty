import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PublicSalonDataRequest = {
  slug?: string;
  salonId?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = (await req.json().catch(() => ({}))) as PublicSalonDataRequest;
    const slug = (body.slug ?? "").trim();
    const salonId = (body.salonId ?? "").trim();

    console.log("public-salon-data: received", { slug, salonId });

    if (!slug && !salonId) {
      return new Response(
        JSON.stringify({ error: "Missing slug or salonId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const salonQuery = admin.from("salons").select("*");
    const { data: salon, error: salonError } = salonId
      ? await salonQuery.eq("id", salonId).maybeSingle()
      : await salonQuery.eq("slug", slug).maybeSingle();

    if (salonError) {
      console.error("public-salon-data: salonError", salonError);
      return new Response(
        JSON.stringify({ error: "Failed to load salon" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    if (!salon) {
      console.log("public-salon-data: salon not found");
      return new Response(
        JSON.stringify({ salon: null, professionals: [], services: [], professionalServices: [], subscription: { isActive: false } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const { data: subscription } = await admin
      .from("subscriptions")
      .select("status, plan, current_period_end")
      .eq("user_id", salon.owner_id)
      .maybeSingle();

    const isSubscriptionActive = subscription?.status === "active";

    const { data: professionals } = await admin
      .from("professionals")
      .select("*")
      .eq("salon_id", salon.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    const { data: services } = await admin
      .from("services")
      .select("*")
      .eq("salon_id", salon.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    const { data: professionalServices } = await admin
      .from("professional_services")
      .select("*");

    console.log("public-salon-data: loaded", {
      salonId: salon.id,
      professionals: professionals?.length ?? 0,
      services: services?.length ?? 0,
      subscriptionStatus: subscription?.status ?? "none",
    });

    return new Response(
      JSON.stringify({
        salon,
        professionals: professionals ?? [],
        services: services ?? [],
        professionalServices: professionalServices ?? [],
        subscription: {
          isActive: isSubscriptionActive,
          status: subscription?.status ?? "inactive",
          plan: subscription?.plan ?? null,
          expiresAt: subscription?.current_period_end ?? null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    console.error("public-salon-data: error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
