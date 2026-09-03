export type GatewayPayment = {
  order_id: string;
  transaction_id?: string;
  utr?: string;
  amount: number | string;
};

const gatewayBaseUrl = () => Deno.env.get('FAMGATEWAY_BASE_URL') || 'https://fam.aryanispe.in';

export async function verifyFamGatewayOrder(orderId: string): Promise<GatewayPayment> {
  const apiKey = Deno.env.get('FAMGATEWAY_API_KEY');
  if (!apiKey) throw new Error('FamGateway is not configured.');

  const url = new URL('/api/verify-order.php', gatewayBaseUrl());
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('order_id', orderId);
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status !== 'success' || !payload.data) {
    throw new Error(payload.message || 'Payment is still pending.');
  }
  return payload.data as GatewayPayment;
}

export async function finalizeFamPayment(admin: any, payment: any, gatewayPayment: GatewayPayment) {
  const metadata = payment.metadata || {};
  const expectedAmount = Math.round(Number(metadata.fam_payable_amount) * 100);
  const receivedAmount = Math.round(Number(gatewayPayment.amount) * 100);
  if (gatewayPayment.order_id !== metadata.fam_order_id || !expectedAmount || expectedAmount !== receivedAmount) {
    throw new Error('FamGateway payment details did not match this order.');
  }

  const { data: claimed, error: claimError } = await admin
    .from('payment_transactions')
    .update({ status: 'processing' })
    .eq('id', payment.id)
    .eq('status', 'pending')
    .select()
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) {
    const { data: current } = await admin.from('payment_transactions').select('*').eq('id', payment.id).maybeSingle();
    return current;
  }

  let completedMetadata = { ...metadata, fam_transaction_id: gatewayPayment.transaction_id || '', fam_utr: gatewayPayment.utr || '' };
  try {
    if (claimed.purpose === 'reservation') {
      const { data: product, error: productError } = await admin.from('products').select('id,price,status').eq('id', metadata.product_id).eq('seller_id', metadata.seller_id).single();
      if (productError || !product || product.status !== 'Available') throw new Error('Payment received, but this item is no longer available. Manual review is required.');
      const { data: reservation, error } = await admin.from('reservations').insert({ product_id: product.id, buyer_id: claimed.user_id, seller_id: metadata.seller_id, deposit_amount: claimed.amount, remaining_amount: Number(product.price) - Number(claimed.amount), payment_id: gatewayPayment.utr || gatewayPayment.transaction_id || metadata.fam_order_id, status: 'Reserved' }).select().single();
      if (error) throw error;
      await admin.from('products').update({ status: 'Reserved', buyer_id: claimed.user_id }).eq('id', product.id);
      if (metadata.location && metadata.meet_time) await admin.from('meetups').insert({ reservation_id: reservation.id, location: metadata.location, meet_time: metadata.meet_time, status: 'Proposed', proposed_by: claimed.user_id });
      completedMetadata = { ...completedMetadata, reservation_id: reservation.id };
    } else if (claimed.purpose === 'boost') {
      const until = new Date(Date.now() + Number(metadata.days) * 86400000).toISOString();
      const { error } = await admin.from('products').update({ is_boosted: true, boosted_at: new Date().toISOString(), boosted_until: until }).eq('id', metadata.product_id).eq('seller_id', claimed.user_id);
      if (error) throw error;
    }

    const { data: completed, error: completionError } = await admin.from('payment_transactions').update({ status: 'success', payment_id: gatewayPayment.utr || gatewayPayment.transaction_id || metadata.fam_order_id, metadata: completedMetadata, completed_at: new Date().toISOString(), failure_reason: null }).eq('id', claimed.id).select().single();
    if (completionError) throw completionError;
    return completed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const { data: review } = await admin.from('payment_transactions').update({ status: 'manual_review', failure_reason: message, metadata: completedMetadata }).eq('id', claimed.id).select().single();
    return review;
  }
}
