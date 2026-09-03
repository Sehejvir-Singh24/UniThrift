import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const appUrl = Deno.env.get('APP_URL') || 'https://unithrift.co.in';
const gatewayBaseUrl = () => Deno.env.get('FAMGATEWAY_BASE_URL') || 'https://fam.aryanispe.in';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) throw new Error('Sign in is required.');
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('Unauthorized.');
    const apiKey = Deno.env.get('FAMGATEWAY_API_KEY');
    if (!apiKey) throw new Error('FamGateway is not configured.');

    const body = await req.json();
    const purpose = body.purpose;
    let amount = 0, metadata: Record<string, unknown> = {}, returnPath = '/marketplace/marketplace.html';

    if (purpose === 'reservation') {
      const { data: product } = await client.from('products').select('id,title,price,seller_id,status').eq('id', body.product_id).single();
      if (!product || product.status !== 'Available') throw new Error('This item is no longer available.');
      if (product.seller_id === user.id) throw new Error('You cannot reserve your own item.');
      amount = Number((Number(product.price) * .25).toFixed(2));
      metadata = { product_id: product.id, seller_id: product.seller_id, location: body.location || '', meet_time: body.meet_time || '' };
      returnPath = '/core/chat.html';
    } else if (purpose === 'flatmate_unlock') {
      const { data: listing } = await client.from('roommate_listings').select('id,user_id').eq('id', body.listing_id).single();
      if (!listing || listing.user_id === user.id) throw new Error('This listing cannot be unlocked.');
      amount = 39;
      metadata = { listing_id: listing.id };
      returnPath = '/roommates/flatmates.html';
    } else if (purpose === 'boost') {
      const days = Number(body.days);
      if (!Number.isInteger(days) || ![2, 3, 5, 7, 14, 30].includes(days)) throw new Error('Invalid boost duration.');
      const { data: product } = await client.from('products').select('id,title,seller_id').eq('id', body.product_id).single();
      if (!product || product.seller_id !== user.id) throw new Error('Only the seller can boost this listing.');
      amount = days * 19;
      metadata = { product_id: product.id, days, return_path: body.return_path || '/core/profile.html' };
      returnPath = String(metadata.return_path);
    } else throw new Error('Unsupported payment purpose.');

    const txnid = `fam${Date.now()}${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`;
    const redirectUrl = `${appUrl}/payments/fam-status.html?txnid=${encodeURIComponent(txnid)}`;
    const gatewayUrl = new URL('/api/qr.php', gatewayBaseUrl());
    gatewayUrl.searchParams.set('api_key', apiKey);
    gatewayUrl.searchParams.set('amount', amount.toFixed(2));
    gatewayUrl.searchParams.set('redirect_url', redirectUrl);
    const gatewayResponse = await fetch(gatewayUrl);
    const gateway = await gatewayResponse.json().catch(() => ({}));
    if (!gatewayResponse.ok || gateway.status !== 'success' || !gateway.data?.order_id || !gateway.data?.checkout_url || !gateway.data?.payable_amount) {
      throw new Error(gateway.message || 'FamGateway could not create a checkout.');
    }

    const paymentMetadata = { ...metadata, return_path: returnPath, fam_order_id: gateway.data.order_id, fam_payable_amount: Number(gateway.data.payable_amount) };
    const { error } = await client.from('payment_transactions').insert({ txnid, user_id: user.id, purpose, amount, metadata: paymentMetadata });
    if (error) throw error;
    return json({ checkout_url: gateway.data.checkout_url });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
});
