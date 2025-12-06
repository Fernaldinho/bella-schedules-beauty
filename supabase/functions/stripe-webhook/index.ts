import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("Webhook event received:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          console.log("Activating subscription for user:", userId);
          
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          const { error } = await supabase
            .from("subscriptions")
            .update({
              status: "active",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);

          if (error) {
            console.error("Error updating subscription:", error);
          } else {
            console.log("Subscription activated successfully");
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log("Subscription updated:", subscription.id, "Status:", subscription.status);

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: subscription.status === "active" ? "active" : "inactive",
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        console.log("Subscription cancelled:", subscription.id);

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString()
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }
});
