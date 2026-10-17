import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const formatPrice = (price) => `$${Number(price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`

const Storefront = () => {
    const { shopSlug } = useParams()
    const navigate = useNavigate()
    const [store, setStore] = useState(null)
    const [products, setProducts] = useState([])
    const [cart, setCart] = useState({})
    const [search, setSearch] = useState('')
    const [loadedSlug, setLoadedSlug] = useState('')
    const [loadError, setLoadError] = useState('')
    const [cartNotice, setCartNotice] = useState('')
    const isLoading = loadedSlug !== shopSlug

    useEffect(() => {
        let isCurrentRequest = true

        axios.get(`http://localhost:8004/product/store/${encodeURIComponent(shopSlug)}`)
            .then(({ data }) => {
                if (!isCurrentRequest) return
                setLoadError('')
                if (data.shop.shopName !== shopSlug) {
                    navigate(`/shop/${data.shop.shopName}`, { replace: true })
                }
                setStore(data.shop)
                setProducts(data.products)
            })
            .catch((error) => {
                if (isCurrentRequest) {
                    setLoadError(error.response?.data?.message || 'This shop could not be loaded. Please try again.')
                }
            })
            .finally(() => {
                if (isCurrentRequest) setLoadedSlug(shopSlug)
            })

        return () => {
            isCurrentRequest = false
        }
    }, [shopSlug, navigate])

    const visibleProducts = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return products
        return products.filter((product) =>
            `${product.productname} ${product.productdescription}`.toLowerCase().includes(query)
        )
    }, [products, search])

    const cartItems = products.filter((product) => cart[product._id])
    const cartCount = cartItems.reduce((count, product) => count + cart[product._id], 0)
    const cartTotal = cartItems.reduce(
        (total, product) => total + Number(product.productprice) * cart[product._id],
        0
    )

    const updateQuantity = (product, change) => {
        setCartNotice('')
        const currentQuantity = cart[product._id] || 0
        if (change > 0 && currentQuantity >= Number(product.stock)) {
            setCartNotice(`Only ${product.stock} ${product.productname} available.`)
            return
        }

        setCart((currentCart) => {
            const quantity = currentCart[product._id] || 0
            const nextQuantity = Math.min(Number(product.stock), quantity + change)
            const nextCart = { ...currentCart }
            if (nextQuantity <= 0) delete nextCart[product._id]
            else nextCart[product._id] = nextQuantity
            return nextCart
        })
    }

    if (isLoading) {
        return (
            <main className="storefront">
                <div className="storefront-shell">
                    <div className="storefront-loading" role="status" aria-label="Loading shop">
                        <span className="storefront-skeleton storefront-skeleton--eyebrow" />
                        <span className="storefront-skeleton storefront-skeleton--title" />
                        <div className="storefront-product-grid">
                            {[1, 2, 3, 4].map((item) => (
                                <div className="storefront-product-skeleton" key={item}>
                                    <span className="storefront-skeleton storefront-skeleton--image" />
                                    <span className="storefront-skeleton storefront-skeleton--line" />
                                    <span className="storefront-skeleton storefront-skeleton--short" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    if (loadError) {
        return (
            <main className="storefront">
                <div className="storefront-shell storefront-message">
                    <p className="storefront-kicker">Storefront unavailable</p>
                    <h1>We couldn’t find that shop.</h1>
                    <p>{loadError}</p>
                    <a className="storefront-text-link" href="/">Return to StoreCraft</a>
                </div>
            </main>
        )
    }

    return (
        <main className="storefront">
            <div className="storefront-shell">
                <header className="storefront-topbar">
                    <a className="storefront-wordmark" href="/" aria-label="StoreCraft home">
                        <span className="storefront-mark">S</span>
                        <span>StoreCraft</span>
                    </a>
                    <span className="storefront-topbar-note">A shop shared with you</span>
                </header>

                <section className="storefront-hero" aria-labelledby="storefront-title">
                    <div className="storefront-hero-copy">
                        <p className="storefront-kicker">Independent storefront</p>
                        <h1 id="storefront-title">{store.storeName}</h1>
                        <p className="storefront-byline">A collection by {store.username}</p>
                    </div>
                    <div className="storefront-hero-aside" aria-hidden="true">
                        {store.profilepicture ? (
                            <img src={store.profilepicture} alt="" />
                        ) : (
                            <span>{store.storeName.slice(0, 1).toUpperCase()}</span>
                        )}
                    </div>
                </section>

                <div className="storefront-layout">
                    <section className="storefront-catalog" aria-labelledby="catalog-title">
                        <div className="storefront-catalog-heading">
                            <div>
                                <p className="storefront-kicker">The collection</p>
                                <h2 id="catalog-title">Shop all</h2>
                            </div>
                            <label className="storefront-search">
                                <span className="storefront-sr-only">Search products</span>
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <circle cx="11" cy="11" r="7" />
                                    <path d="m16 16 4 4" />
                                </svg>
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Find something"
                                />
                            </label>
                        </div>

                        {products.length === 0 ? (
                            <div className="storefront-empty">
                                <span className="storefront-empty-mark">S</span>
                                <h3>This shop is getting ready.</h3>
                                <p>There are no products listed just yet. Check back soon.</p>
                            </div>
                        ) : visibleProducts.length === 0 ? (
                            <div className="storefront-empty storefront-empty--compact">
                                <h3>No matches found</h3>
                                <p>Try another product name or search term.</p>
                            </div>
                        ) : (
                            <div className="storefront-product-grid">
                                {visibleProducts.map((product) => {
                                    const isOutOfStock = Number(product.stock) <= 0
                                    return (
                                        <article className="storefront-product" key={product._id}>
                                            <div className="storefront-product-image">
                                                <img src={product.productimage} alt={product.productname} loading="lazy" />
                                                {isOutOfStock && <span className="storefront-stock-tag">Sold out</span>}
                                            </div>
                                            <div className="storefront-product-info">
                                                <div className="storefront-product-title-row">
                                                    <h3>{product.productname}</h3>
                                                    <span>{formatPrice(product.productprice)}</span>
                                                </div>
                                                <p>{product.productdescription}</p>
                                                <button
                                                    className="storefront-add-button"
                                                    type="button"
                                                    onClick={() => updateQuantity(product, 1)}
                                                    disabled={isOutOfStock}
                                                >
                                                    {isOutOfStock ? 'Currently unavailable' : 'Add to bag'}
                                                    {!isOutOfStock && <span aria-hidden="true">+</span>}
                                                </button>
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        )}
                    </section>

                    <aside className="storefront-bag" aria-labelledby="bag-title">
                        <div className="storefront-bag-heading">
                            <div>
                                <p className="storefront-kicker">Your selection</p>
                                <h2 id="bag-title">Shopping bag</h2>
                            </div>
                            <span className="storefront-bag-count" aria-label={`${cartCount} items`}>
                                {cartCount}
                            </span>
                        </div>

                        {cartItems.length === 0 ? (
                            <p className="storefront-bag-empty">Your bag is empty. Add something you love.</p>
                        ) : (
                            <>
                                <ul className="storefront-bag-items">
                                    {cartItems.map((product) => (
                                        <li className="storefront-bag-item" key={product._id}>
                                            <img src={product.productimage} alt="" />
                                            <div className="storefront-bag-item-copy">
                                                <strong>{product.productname}</strong>
                                                <span>{formatPrice(product.productprice)}</span>
                                                <div className="storefront-quantity" aria-label={`Quantity of ${product.productname}`}>
                                                    <button type="button" onClick={() => updateQuantity(product, -1)} aria-label={`Remove one ${product.productname}`}>−</button>
                                                    <span>{cart[product._id]}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(product, 1)}
                                                        disabled={cart[product._id] >= Number(product.stock)}
                                                        aria-label={`Add one ${product.productname}`}
                                                    >+</button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="storefront-bag-total">
                                    <span>Subtotal</span>
                                    <strong>{formatPrice(cartTotal)}</strong>
                                </div>
                                <p className="storefront-checkout-note">
                                    Checkout and payments will be available soon. Your bag is not an order.
                                </p>
                                {cartNotice && <p className="storefront-cart-notice" role="status">{cartNotice}</p>}
                                <button className="storefront-checkout" type="button" disabled>
                                    Checkout coming soon
                                </button>
                            </>
                        )}
                    </aside>
                </div>

                <footer className="storefront-footer">
                    <span>StoreCraft</span>
                    <span>Shared directly by {store.username}</span>
                </footer>
            </div>
        </main>
    )
}

export default Storefront
