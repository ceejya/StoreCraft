# StoreCraft design

## Public storefront

- Keep the customer storefront visually and behaviorally separate from seller dashboard screens.
- Use the existing warm-paper, ink, and cobalt palette with a restrained editorial layout.
- Public product cards show only customer-relevant product fields. Shopping bag quantities cannot exceed available stock.
- Provide loading, not-found, empty-catalog, no-search-results, out-of-stock, checkout validation/submission, payment pending/failure/review/success, and status-recovery states.
- Keep the storefront usable by keyboard and at narrow mobile widths; respect reduced-motion preferences.

## Checkout boundary

The bag subtotal is an estimate. Checkout accepts guest contact/delivery details from a public shop, but the server reloads product prices and stock and creates a one-seller order. Only a provider-verified payment for the exact expected NGN amount marks the order paid and decrements stock. Delivery fees are not part of the payment total and are arranged separately with the seller. Never treat a browser redirect as proof of payment.
