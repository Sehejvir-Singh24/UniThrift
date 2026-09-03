import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { finalizeFamPayment, verifyFamGatewayOrder } from "../_shared/fam-payments.ts";

const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
const equal = (left: string, right: string) => left.length === right.length && ![...left].reduce((different, character, index) => different | (character.charCodeAt(0) ^ right.charCodeAt(index)), 0);

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const apiKey = Deno.env.get('FAMGATEWAY_API_KEY');
  if (!apiKey) return new Response('Gateway not configured', { status: 503 });
  const rawBody = await req.text();
  const signature = req.headers.get('x-famgateway-signature') || '';
  const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(apiKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(rawBody)));
  if (!equal(expected, signature)) return new Response('Invalid signature', { status: 401 });

  try {
    const event = JSON.parse(rawBody);
    // FamGateway's dashboard sends a signed synthetic success event when the
    // merchant clicks "Test & Verify". Acknowledge it without touching payment
    // records; real events must still match an order created by our backend.
    if (event.is_test === true) return new Response('OK', { status: 200 });
    if (event.event !== 'payment.success') return new Response('Ignored', { status: 200 });
    const orderId = event.order_id || event.data?.order_id;
    if (!orderId) return new Response('Order missing', { status: 400 });
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: payment } = await admin.from('payment_transactions').select('*').eq('metadata->>fam_order_id', orderId).maybeSingle();
    if (!payment) return new Response('Order not found', { status: 404 });
    if (payment.status === 'success' || payment.status === 'manual_review') return new Response('OK', { status: 200 });
    const gatewayPayment = await verifyFamGatewayOrder(orderId);
    await finalizeFamPayment(admin, payment, gatewayPayment);
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('FamGateway webhook failed', error);
    return new Response('Unable to process event', { status: 500 });
  }
});
