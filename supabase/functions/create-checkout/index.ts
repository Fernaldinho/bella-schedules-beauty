import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      customerId = customer.id;
    }

    // Create checkout session - create price on the fly for testing
    const { origin } = new URL(req.url);
    const baseUrl = req.headers.get("origin") || origin;

    // Try to use the configured price, if it doesn't exist, create one dynamically
    let priceId = "price_1SbFDcP29UxAYo1Io8zi8kAf";
    
    try {
      await stripe.prices.retrieve(priceId);
    } catch {
      // Price doesn't exist, create a product and price dynamically
      console.log("Price not found, creating dynamic product and price...");
      
      const product = await stripe.products.create({
        name: "Plano PRO - Agendamento",
        description: "Acesso completo ao sistema de agendamento",
      });
      
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 4530, // R$ 45,30 in cents
        currency: "brl",
        recurring: { interval: "month" },
      });
      
      priceId = price.id;
      console.log("Created dynamic price:", priceId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/admin?success=true`,
      cancel_url: `${baseUrl}/admin?canceled=true`,
      metadata: { supabase_user_id: user.id }
    });

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
