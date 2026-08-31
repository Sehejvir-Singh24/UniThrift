import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const encoder = new TextEncoder();
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-512', encoder.encode(value)))).map(b => b.toString(16).padStart(2, '0')).join('');
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) throw new Error('Sign in is required.');
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    const body = await req.json();
    const purpose = body.purpose;
    const { data: profile } = await client.from('profiles').select('full_name,email,phone_number').eq('id', user.id).single();
    if (!profile) throw new Error('Profile not found.');
    let amount = 0, productinfo = '', metadata: Record<string, unknown> = {}, returnPath = '/marketplace/marketplace.html';

    if (purpose === 'reservation') {
      const { data: product } = await client.from('products').select('id,title,price,seller_id,status').eq('id', body.product_id).single();
      if (!product || product.status !== 'Available') throw new Error('This item is no longer available.');
      if (product.seller_id === user.id) throw new Error('You cannot reserve your own item.');
      amount = Number((Number(product.price) * .25).toFixed(2)); productinfo = `Security Deposit: ${product.title}`;
      metadata = { product_id: product.id, seller_id: product.seller_id, location: body.location || '', meet_time: body.meet_time || '' }; returnPath = '/core/chat.html';
    } else if (purpose === 'flatmate_unlock') {
      const { data: listing } = await client.from('roommate_listings').select('id,user_id').eq('id', body.listing_id).single();
      if (!listing || listing.user_id === user.id) throw new Error('This listing cannot be unlocked.');
      amount = 39; productinfo = 'UniThrift flatmate contact unlock'; metadata = { listing_id: listing.id }; returnPath = '/roommates/flatmates.html';
    } else if (purpose === 'boost') {
      const days = Number(body.days);
      if (!Number.isInteger(days) || days < 2 || ![2,3,5,7,14,30].includes(days)) throw new Error('Invalid boost duration.');
      const { data: product } = await client.from('products').select('id,title,seller_id').eq('id', body.product_id).single();
      if (!product || product.seller_id !== user.id) throw new Error('Only the seller can boost this listing.');
      amount = days * 19; productinfo = `UniThrift listing boost: ${product.title}`; metadata = { product_id: product.id, days, return_path: body.return_path || '/core/profile.html' }; returnPath = String(metadata.return_path);
    } else throw new Error('Unsupported payment purpose.');

    const key = Deno.env.get('PAYU_KEY'), salt = Deno.env.get('PAYU_SALT');
    if (!key || !salt) throw new Error('PayU credentials are not configured.');
    const txnid = `ut${Date.now()}${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`;
    const name = profile.full_name || 'UniThrift Student', email = profile.email || user.email || '';
    // Transaction data is retained in Supabase; only a non-sensitive purpose label goes to PayU.
    const udf1 = purpose, udf2 = '';
    const requestHash = await hash([key, txnid, amount.toFixed(2), productinfo, name, email, udf1, udf2, '', '', '', '', '', '', '', '', '', salt].join('|'));
    const { error } = await client.from('payment_transactions').insert({ txnid, user_id: user.id, purpose, amount, metadata });
    if (error) throw error;
    const functionOrigin = new URL(req.url).origin;
    const returnUrl = `${functionOrigin}/payu-return`;
    return json({ action: Deno.env.get('PAYU_ENV') === 'live' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment', fields: { key, txnid, amount: amount.toFixed(2), productinfo, firstname: name, email, phone: profile.phone_number || '', udf1, udf2, surl: returnUrl, furl: returnUrl, hash: requestHash, return_path: returnPath } });
  } catch (error) { return json({ error: error instanceof Error ? error.message : String(error) }, 400); }
});
