// FamGateway checkout client. The API key remains exclusively inside Supabase Edge Functions.
(function (window) {
  const FUNCTIONS_URL = 'https://bwhvbynmqubjwgonsywd.supabase.co/functions/v1';
  const ANON_KEY = 'sb_publishable_rDDTMnU-KaDG941KB0gaYA_5dHnXX1G';

  window.startFamGatewayPayment = async function (payload) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Please sign in before making a payment.');
    const response = await fetch(`${FUNCTIONS_URL}/create-fam-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`, apikey: ANON_KEY },
      body: JSON.stringify(payload)
    });
    const checkout = await response.json();
    if (!response.ok || !checkout.checkout_url) throw new Error(checkout.error || 'Unable to start FamGateway checkout.');
    window.location.assign(checkout.checkout_url);
  };
})(window);
