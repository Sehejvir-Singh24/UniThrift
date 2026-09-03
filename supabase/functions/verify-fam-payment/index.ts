import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { finalizeFamPayment, verifyFamGatewayOrder } from "../_shared/fam-payments.ts";

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) throw new Error('Sign in is required.');
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('Unauthorized.');
    const { txnid } = await req.json();
    if (!txnid) throw new Error('Payment reference missing.');
    const { data: payment } = await client.from('payment_transactions').select('*').eq('txnid', txnid).eq('user_id', user.id).maybeSingle();
    if (!payment) throw new Error('Payment not found.');
    if (payment.status === 'success' || payment.status === 'manual_review') return json({ payment });
    if (payment.status !== 'pending') return json({ payment });

    const gatewayPayment = await verifyFamGatewayOrder(payment.metadata?.fam_order_id);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const finalized = await finalizeFamPayment(admin, payment, gatewayPayment);
    return json({ payment: finalized });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'Payment is still pending.') return json({ pending: true });
    return json({ error: message }, 400);
  }
});
