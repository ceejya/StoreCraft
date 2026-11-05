# StoreCraft product

StoreCraft lets sellers create a public storefront and share it with customers. Seller account management remains private; the `/shop/:shopSlug` route is public and only exposes a shop's display name, public profile image, and listed product details.

Every new seller receives a default shop name and unique slug. Sellers can rename their shop later. Previous slugs remain reserved and resolve to the current storefront so links already shared with customers continue to work.

Customers can search a shop's products and build a per-shop shopping bag. Checkout is available only from that shop's public URL and uses guest email and delivery details. Each order belongs to one seller. StoreCraft calculates the order total on the server and supports Paystack and Flutterwave hosted checkout; an order is paid only after server-side provider verification. Stock is decremented only after a verified, exact-amount payment. Amount mismatches and post-payment stock conflicts require review before fulfillment. Delivery fees are not currently calculated or collected by checkout; customers and sellers arrange delivery separately.
