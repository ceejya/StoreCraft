# StoreCraft design

## Public storefront

- Keep the customer storefront visually and behaviorally separate from seller dashboard screens.
- Use the existing warm-paper, ink, and cobalt palette with a restrained editorial layout.
- Public product cards show only customer-relevant product fields. Shopping bag quantities cannot exceed available stock.
- Provide loading, not-found, empty-catalog, no-search-results, out-of-stock, and disabled-checkout states.
- Keep the storefront usable by keyboard and at narrow mobile widths; respect reduced-motion preferences.

## Checkout boundary

The shopping bag is a browsing aid only. Do not represent its subtotal as an order or accept payment until a server-verified checkout flow is implemented.
