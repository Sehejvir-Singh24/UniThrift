# PayU deployment setup

The app uses PayU Hosted Checkout. The PayU merchant key is safe to send in a checkout form; the salt is never sent to the browser and must only exist as a Supabase secret.

Set these Supabase Edge Function secrets before deploying:

```powershell
supabase secrets set PAYU_KEY="your_payu_key" PAYU_SALT="your_32_character_salt" PAYU_ENV="test" APP_URL="https://unithrift.co.in"
```

Use `PAYU_ENV="live"` only with PayU production credentials. Deploy both functions, then apply [payu_payment_transactions_migration.sql](../db/payu_payment_transactions_migration.sql):

```powershell
supabase functions deploy create-payu-payment
supabase functions deploy payu-return
```

`payu-return` deliberately has JWT verification disabled because PayU posts the customer back without a Supabase token. It validates the PayU reverse SHA-512 hash, transaction ID, amount, and persisted transaction state before marking a payment successful or fulfilling it.
