// PayU Hosted Checkout client. Merchant credentials and hashes stay in Edge Functions.
(function (window) {
  const FUNCTIONS_URL = 'https://bwhvbynmqubjwgonsywd.supabase.co/functions/v1';
  const ANON_KEY = 'sb_publishable_rDDTMnU-KaDG941KB0gaYA_5dHnXX1G';

  window.startPayUPayment = async function (payload) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Please sign in before making a payment.');

    const response = await fetch(`${FUNCTIONS_URL}/create-payu-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': ANON_KEY
      },
      body: JSON.stringify(payload)
    });
    const checkout = await response.json();
    if (!response.ok) throw new Error(checkout.error || 'Unable to start PayU checkout.');

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = checkout.action;
    form.style.display = 'none';
    Object.entries(checkout.fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = String(value ?? '');
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };
})(window);
