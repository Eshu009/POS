import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = hmac("sha256", RAZORPAY_KEY_SECRET, body, "utf8", "hex");

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      return new Response(JSON.stringify({ status: "success", verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ status: "failed", verified: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
