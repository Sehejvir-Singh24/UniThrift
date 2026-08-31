import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const encoder = new TextEncoder();
const sha512 = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-512', encoder.encode(value)))).map(b => b.toString(16).padStart(2, '0')).join('');
const appUrl = Deno.env.get('APP_URL') || 'https://unithrift.co.in';
const statusUrl = (txnid: string) => `${appUrl}/payments/payu-status.html?txnid=${encodeURIComponent(txnid)}`;

serve(async (req) => {
  const form = await req.formData();
  const get = (name: string) => String(form.get(name) || '');
  const txnid = get('txnid'), status = get('status').toLowerCase(), receivedHash = get('hash');
  if (!txnid) return Response.redirect(`${appUrl}/payments/payu-status.html`, 303);
  const salt = Deno.env.get('PAYU_SALT') || '';
  const reverseHash = await sha512([salt, status, '', '', '', '', '', get('udf5'), get('udf4'), get('udf3'), get('udf2'), get('udf1'), get('email'), get('firstname'), get('productinfo'), get('amount'), txnid, get('key')].join('|'));
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: payment } = await admin.from('payment_transactions').select('*').eq('txnid', txnid).maybeSingle();
  if (!payment || payment.status === 'success') return Response.redirect(statusUrl(txnid), 303);
  if (receivedHash !== reverseHash || status !== 'success' || Number(get('amount')) !== Number(payment.amount)) {
    await admin.from('payment_transactions').update({ status: 'failed', failure_reason: 'PayU payment validation failed' }).eq('id', payment.id);
    return Response.redirect(statusUrl(txnid), 303);
  }
  let metadata = payment.metadata || {};
  try {
    if (payment.purpose === 'reservation') {
      const { data: product, error: productError } = await admin.from('products').select('id,price,status').eq('id', metadata.product_id).eq('seller_id', metadata.seller_id).single();
      if (productError || !product || product.status !== 'Available') throw new Error('The reserved item is no longer available.');
      const { data: reservation, error } = await admin.from('reservations').insert({ product_id: product.id, buyer_id: payment.user_id, seller_id: metadata.seller_id, deposit_amount: payment.amount, remaining_amount: Number(product.price) - payment.amount, payment_id: get('mihpayid'), status: 'Reserved' }).select().single();
      if (error) throw error;
      await admin.from('products').update({ status: 'Reserved', buyer_id: payment.user_id }).eq('id', product.id);
      if (metadata.location && metadata.meet_time) await admin.from('meetups').insert({ reservation_id: reservation.id, location: metadata.location, meet_time: metadata.meet_time, status: 'Proposed', proposed_by: payment.user_id });
      metadata = { ...metadata, reservation_id: reservation.id };
    } else if (payment.purpose === 'boost') {
      const until = new Date(Date.now() + Number(metadata.days) * 86400000).toISOString();
      await admin.from('products').update({ is_boosted: true, boosted_at: new Date().toISOString(), boosted_until: until }).eq('id', metadata.product_id).eq('seller_id', payment.user_id);
    }
    await admin.from('payment_transactions').update({ status: 'success', payment_id: get('mihpayid'), metadata, completed_at: new Date().toISOString() }).eq('id', payment.id);
  } catch (error) { await admin.from('payment_transactions').update({ status: 'failed', failure_reason: error instanceof Error ? error.message : String(error) }).eq('id', payment.id); }
  return Response.redirect(statusUrl(txnid), 303);
});
