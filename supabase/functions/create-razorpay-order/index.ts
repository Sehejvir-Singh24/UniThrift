import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, currency = 'INR', receipt } = await req.json();

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    // Create order via Razorpay API
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Razorpay uses paise (1 INR = 100 paise)
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Razorpay API error: ${errorData}`);
    }

    const order = await response.json();

    return new Response(
      JSON.stringify({ 
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
