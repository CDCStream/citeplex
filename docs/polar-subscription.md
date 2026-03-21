# Polar: “You already have an active subscription”

This message comes from **Polar** when the **customer email** (or linked Polar customer) already has an **active** subscription for that product.

## Fix (Polar dashboard)

1. Open [Polar Dashboard](https://polar.sh) → your organization.
2. Go to **Customers** (or **Subscriptions**).
3. Find the customer by **email** (e.g. old test account).
4. Open the **subscription** → **Cancel** (or revoke) so it is no longer active.
5. Optionally remove/archive the test customer if your workflow allows it.

You do **not** need to delete users in Supabase for this specific Polar error—Polar blocks checkout based on **its** subscription state. After the old subscription is canceled in Polar, checkout can proceed.

## Auto-filled email on checkout

The app passes `customerEmail` (and `customerName` when available) from the logged-in `users` row into Polar checkout creation (`/checkout` route). Middleware requires login for `/checkout`, so the field should match the account email.
