import { API_URL } from "../config"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import axios from "axios"

const formatPrice = (amount) => new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 2,
}).format(Number(amount) || 0)

const emptyDetails = { customerName: "", email: "", phone: "", address: "", city: "", state: "" }

const SummaryImage = ({ src, alt }) => {
    const [failed, setFailed] = useState(false)
    if (!src || failed) return <span className="checkout-summary-image-fallback" aria-hidden="true" />
    return <img src={src} alt={alt} onError={() => setFailed(true)} />
}

const StoreCheckout = () => {
    const { shopSlug } = useParams()
    const navigate = useNavigate()
    const [store, setStore] = useState(null)
    const [products, setProducts] = useState([])
    const [details, setDetails] = useState(emptyDetails)
    const [provider, setProvider] = useState("paystack")
    const [phase, setPhase] = useState("loading")
    const [error, setError] = useState("")
    const [retry, setRetry] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const headingRef = useRef(null)

    useEffect(() => {
        let current = true
        Promise.all([
            axios.get(`${API_URL}/product/store/${encodeURIComponent(shopSlug)}`),
        ]).then(([{ data }]) => {
            if (!current) return
            setStore(data.shop)
            setProducts(data.products)
            if (data.shop.shopName !== shopSlug) {
                navigate(`/shop/${encodeURIComponent(data.shop.shopName)}/checkout`, { replace: true })
            }
            try {
                const saved = JSON.parse(localStorage.getItem(`storecraft:cart:${shopSlug}`) || "{}")
                const stockById = new Map(data.products.map((product) => [product._id, Number(product.stock)]))
                const availableCart = Object.fromEntries(Object.entries(saved)
                    .filter(([id, quantity]) => stockById.has(id) && Number(quantity) > 0)
                    .map(([id, quantity]) => [id, Math.min(Number(quantity), stockById.get(id))])
                    .filter(([, quantity]) => quantity > 0))
                localStorage.setItem(`storecraft:cart:${shopSlug}`, JSON.stringify(availableCart))
                setCart(availableCart)
            } catch {
                setCart({})
            }
            setPhase("ready")
        }).catch((requestError) => {
            if (!current) return
            setError(requestError.response?.data?.message || "We couldn't load this shop for checkout.")
            setPhase("error")
        })
        return () => { current = false }
    }, [navigate, shopSlug])

    useEffect(() => {
        if (phase === "ready") headingRef.current?.focus()
    }, [phase])

    const [cart, setCart] = useState({})
    const cartItems = useMemo(() => products
        .filter((product) => Number(cart[product._id]) > 0)
        .map((product) => ({ ...product, quantity: Number(cart[product._id]) })), [cart, products])
    const total = cartItems.reduce((sum, item) => sum + Number(item.productprice) * item.quantity, 0)

    const submitCheckout = async (event) => {
        event.preventDefault()
        if (submitting || cartItems.length === 0) return
        setSubmitting(true)
        setError("")
        setRetry(null)
        try {
            const keyName = `storecraft:checkout:${shopSlug}`
            let checkoutKey = sessionStorage.getItem(keyName)
            if (!checkoutKey) {
                checkoutKey = crypto.randomUUID()
                sessionStorage.setItem(keyName, checkoutKey)
            }
            const { data } = await axios.post(`${API_URL}/payments/store/${encodeURIComponent(shopSlug)}/checkout`, {
                ...details,
                provider,
                checkoutKey,
                items: cartItems.map(({ _id, quantity }) => ({ productId: _id, quantity })),
            })
            if (data.checkoutUrl) {
                sessionStorage.removeItem(keyName)
                window.location.assign(data.checkoutUrl)
            } else if (data.statusUrl) {
                sessionStorage.removeItem(keyName)
                window.location.assign(data.statusUrl)
            }
            else if (data.orderCode && data.accessToken) setRetry({ orderCode: data.orderCode, access: data.accessToken })
        } catch (requestError) {
            const response = requestError.response?.data
            setError(response?.message || "We couldn't start checkout. Check your connection and try again.")
            if (response?.orderCode && response?.accessToken) {
                setRetry({ orderCode: response.orderCode, access: response.accessToken })
            }
            setSubmitting(false)
        }
    }

    const retryPayment = async () => {
        if (!retry || submitting) return
        setSubmitting(true)
        setError("")
        try {
            const { data } = await axios.post(`${API_URL}/payments/orders/${encodeURIComponent(retry.orderCode)}/retry`, {
                access: retry.access,
                provider,
            })
            sessionStorage.removeItem(`storecraft:checkout:${shopSlug}`)
            window.location.assign(data.checkoutUrl)
        } catch (requestError) {
            setError(requestError.response?.data?.message || "We couldn't reopen payment. Please try again.")
            setSubmitting(false)
        }
    }

    if (phase === "loading") return <main className="storefront"><div className="storefront-shell storefront-loading" role="status" aria-busy="true"><span className="storefront-kicker">Secure checkout</span><div className="checkout-skeleton" /><p>Preparing your order…</p></div></main>
    if (phase === "error") return <main className="storefront"><div className="storefront-shell storefront-message"><p className="storefront-kicker">Checkout unavailable</p><h1>We couldn’t load this shop.</h1><p>{error}</p><Link className="storefront-text-link" to={`/shop/${encodeURIComponent(shopSlug)}`}>Return to the shop</Link></div></main>

    return (
        <main className="storefront checkout-page">
            <div className="storefront-shell">
                <a className="storefront-skip" href="#checkout-content">Skip to checkout content</a>
                <header className="storefront-topbar">
                    <Link className="storefront-wordmark" to={`/shop/${encodeURIComponent(shopSlug)}`} aria-label={`${store?.storeName || "Shop"} storefront`}>
                        <span className="storefront-mark" aria-hidden="true">S</span><span>StoreCraft</span>
                    </Link>
                    <span className="storefront-topbar-note">Guest checkout</span>
                </header>

                <div className="checkout-heading" id="checkout-content" tabIndex="-1">
                    <Link className="checkout-back" to={`/shop/${encodeURIComponent(shopSlug)}`}>← Back to {store?.storeName || "shop"}</Link>
                    <p className="storefront-kicker">Delivery &amp; payment</p>
                    <h1 ref={headingRef} tabIndex="-1">Checkout</h1>
                    <p>Your order is with <strong>{store?.storeName}</strong>. Use an email address you can access for your payment receipt and order reference.</p>
                </div>

                {cartItems.length === 0 ? (
                    <section className="checkout-empty" aria-labelledby="checkout-empty-title">
                        <p className="storefront-kicker">Your bag is empty</p>
                        <h2 id="checkout-empty-title">Choose something from the shop first.</h2>
                        <Link className="checkout-primary-link" to={`/shop/${encodeURIComponent(shopSlug)}`}>Continue shopping</Link>
                    </section>
                ) : (
                    <form className="checkout-layout" onSubmit={submitCheckout}>
                        <div className="checkout-form-column">
                            <section className="checkout-section" aria-labelledby="delivery-title">
                                <div className="checkout-section-heading"><span>01</span><div><p className="storefront-kicker">Your details</p><h2 id="delivery-title">Where should we deliver?</h2></div></div>
                                <div className="checkout-fields">
                                    <label className="checkout-field checkout-field--wide" htmlFor="checkout-name">Full name<input id="checkout-name" autoComplete="name" name="customerName" value={details.customerName} onChange={(event) => setDetails({ ...details, customerName: event.target.value })} maxLength="120" required /></label>
                                    <label className="checkout-field" htmlFor="checkout-email">Email address<input id="checkout-email" type="email" autoComplete="email" name="email" value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} required /></label>
                                    <label className="checkout-field" htmlFor="checkout-phone">Phone number<input id="checkout-phone" type="tel" autoComplete="tel" name="phone" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} minLength="7" maxLength="40" required /></label>
                                    <label className="checkout-field checkout-field--wide" htmlFor="checkout-address">Street address<input id="checkout-address" autoComplete="street-address" name="address" value={details.address} onChange={(event) => setDetails({ ...details, address: event.target.value })} maxLength="300" required /></label>
                                    <label className="checkout-field" htmlFor="checkout-city">City or town<input id="checkout-city" autoComplete="address-level2" name="city" value={details.city} onChange={(event) => setDetails({ ...details, city: event.target.value })} maxLength="100" required /></label>
                                    <label className="checkout-field" htmlFor="checkout-state">State<input id="checkout-state" autoComplete="address-level1" name="state" value={details.state} onChange={(event) => setDetails({ ...details, state: event.target.value })} maxLength="100" required /></label>
                                </div>
                            </section>

                            <section className="checkout-section" aria-labelledby="payment-choice-title">
                                <div className="checkout-section-heading"><span>02</span><div><p className="storefront-kicker">Payment</p><h2 id="payment-choice-title">Choose how to pay</h2></div></div>
                                <fieldset className="checkout-provider-options">
                                    <legend className="storefront-sr-only">Payment provider</legend>
                                    {[{ id: "paystack", label: "Paystack", detail: "Cards, bank transfer and more" }, { id: "flutterwave", label: "Flutterwave", detail: "Cards, bank transfer and more" }].map((option) => (
                                        <label className={`checkout-provider${provider === option.id ? " is-selected" : ""}`} key={option.id}>
                                            <input type="radio" name="provider" value={option.id} checked={provider === option.id} onChange={() => setProvider(option.id)} />
                                            <span className="checkout-radio" aria-hidden="true" />
                                            <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                                            <span className="checkout-provider-mark" aria-hidden="true">↗</span>
                                        </label>
                                    ))}
                                </fieldset>
                                <p className="checkout-security-note">You’ll complete payment on {provider === "paystack" ? "Paystack’s" : "Flutterwave’s"} secure checkout. StoreCraft never sees your card details.</p>
                            </section>

                            {error && <p className="checkout-error" role="alert">{error}</p>}
                            {retry ? (
                                <button className="storefront-checkout storefront-checkout--active" type="button" onClick={retryPayment} disabled={submitting}>
                                    {submitting ? "Opening payment…" : `Retry with ${provider === "paystack" ? "Paystack" : "Flutterwave"}`}
                                </button>
                            ) : (
                                <button className="storefront-checkout storefront-checkout--active" type="submit" disabled={submitting}>
                                    {submitting ? "Preparing secure checkout…" : `Continue to ${provider === "paystack" ? "Paystack" : "Flutterwave"}`}
                                </button>
                            )}
                            <p className="checkout-footnote">Your order is confirmed only after StoreCraft verifies your payment.</p>
                        </div>

                        <aside className="checkout-summary" aria-labelledby="checkout-summary-title">
                            <p className="storefront-kicker">From {store?.storeName}</p><h2 id="checkout-summary-title">Order summary</h2>
                            <ul className="checkout-summary-items">
                                {cartItems.map((item) => (
                                    <li key={item._id}>
                                        <SummaryImage src={item.productimage} alt="" />
                                        <span><strong>{item.productname}</strong><small>Qty {item.quantity} · {formatPrice(item.productprice)} each</small></span>
                                        <b>{formatPrice(Number(item.productprice) * item.quantity)}</b>
                                    </li>
                                ))}
                            </ul>
                            <div className="checkout-total"><span>Subtotal estimate</span><strong>{formatPrice(total)}</strong></div>
                            <p className="checkout-summary-note">This checkout charges for products only. Delivery arrangements and any delivery fee are confirmed directly with the seller.</p>
                        </aside>
                    </form>
                )}
                <footer className="storefront-footer"><span>StoreCraft</span><span>Secure guest checkout</span></footer>
            </div>
        </main>
    )
}

export default StoreCheckout
