# FamGateway setup

FamGateway is a temporary UPI checkout integration for reservations, listing boosts, and flatmate-contact unlocks. Keep its API key server-side only.

1. Revoke the key previously shared in chat and generate a new one in FamGateway.
2. Set Supabase secrets (never commit them):

   ```sh
   supabase secrets set FAMGATEWAY_API_KEY="replace-with-new-key" APP_URL="https://unithrift.co.in"
   ```

3. Apply `db/famgateway_payment_migration.sql` after the existing payment migration.
4. Deploy the functions:

   ```sh
   supabase functions deploy create-fam-payment
   supabase functions deploy verify-fam-payment
   supabase functions deploy fam-webhook --no-verify-jwt
   ```

5. In FamGateway, configure the webhook URL as `https://bwhvbynmqubjwgonsywd.supabase.co/functions/v1/fam-webhook`.
6. Test all three amounts with real low-value payments before enabling UniThrift routes. FamGateway adds a small unique decimal amount; customers must pay the exact amount shown at checkout.

The temporary UniThrift launch gate currently blocks `/payments/` pages. Remove the launch gate before using this checkout in production.
