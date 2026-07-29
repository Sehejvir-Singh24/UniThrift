import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      product_id,
      seller_id,
      product_price,
      location,
      meet_time,
    } = await req.json();

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      throw new Error('Missing Razorpay payment details');
    }
    if (!product_id || !seller_id || !product_price) {
      throw new Error('Missing reservation details');
    }

    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay secret not configured');
    }

    // ✅ STEP 1: Verify Razorpay signature (HMAC-SHA256)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const keyData = new TextEncoder().encode(RAZORPAY_KEY_SECRET);
    const msgData = new TextEncoder().encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const expectedSignature = new TextDecoder().decode(hexEncode(new Uint8Array(signature)));

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Payment verification failed: Invalid signature');
    }

    // ✅ STEP 2: Create Supabase client with user's auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No auth token provided');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // ✅ STEP 2.5: Fetch actual product price from database securely
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('price')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      throw new Error('Product not found or error fetching price');
    }
    const actual_product_price = parseFloat(product.price);

    // ✅ STEP 3: Calculate deposit (25%) using trusted database price
    const depositAmount = (actual_product_price * 0.25).toFixed(2);
    const remainingAmount = (actual_product_price * 0.75).toFixed(2);

    // ✅ STEP 3.5: Fetch order details from Razorpay to verify the amount paid
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    if (!RAZORPAY_KEY_ID) {
      throw new Error('Razorpay Key ID not configured');
    }

    const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)
      }
    });

    if (!orderResponse.ok) {
      throw new Error('Failed to verify order details with Razorpay');
    }

    const orderDetails = await orderResponse.json();
    const expectedAmountPaise = Math.round(parseFloat(depositAmount) * 100);

    if (orderDetails.amount < expectedAmountPaise) {
      throw new Error(`Payment amount tampering detected. Paid: ${orderDetails.amount}, Required: ${expectedAmountPaise}`);
    }

    // ✅ STEP 4: Create the reservation in the database
    const { data: reservation, error: resError } = await supabaseClient
      .from('reservations')
      .insert({
        product_id,
        buyer_id: user.id,
        seller_id,
        deposit_amount: depositAmount,
        remaining_amount: remainingAmount,
        payment_id: razorpay_payment_id,
        status: 'Reserved',
      })
      .select()
      .single();

    if (resError) throw resError;

    // ✅ STEP 5: Mark product as Reserved
    await supabaseClient
      .from('products')
      .update({ status: 'Reserved', buyer_id: user.id })
      .eq('id', product_id);

    // ✅ STEP 6: Propose the meetup if location/time provided
    if (location && meet_time) {
      await supabaseClient
        .from('meetups')
        .insert({
          reservation_id: reservation.id,
          location,
          meet_time,
          status: 'Proposed',
          proposed_by: user.id,
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reservation_id: reservation.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
