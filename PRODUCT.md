# StoreCraft product

StoreCraft lets sellers create a public storefront and share it with customers. Seller account management remains private; the `/shop/:shopSlug` route is public and only exposes a shop's display name, public profile image, and listed product details.

Every new seller receives a default shop name and unique slug. Sellers can rename their shop later. Previous slugs remain reserved and resolve to the current storefront so links already shared with customers continue to work.

Customers can search a shop's products and build an in-page shopping bag. Orders and payment are intentionally not available until checkout and payment-provider integration are implemented.
