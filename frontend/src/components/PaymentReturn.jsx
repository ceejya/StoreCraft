import { API_URL } from "../config"
import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import axios from "axios"
import PaystackPop from "@paystack/inline-js"

const formatPrice = (amountKobo) => new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 2,
}).format((Number(amountKobo) || 0) / 100)

const PaymentReturn = () => {
    const [searchParams] = useSearchParams()
    const orderCode = searchParams.get("order") || ""
    const access = searchParams.get("access") || ""
    const transactionId = searchParams.get("transaction_id") || ""
    const [order, setOrder] = useState(null)
    const [error, setError] = useState("")
    const [checking, setChecking] = useState(true)
    const [provider, setProvider] = useState("paystack")
    const [retrying, setRetrying] = useState(false)
    const [retryError, setRetryError] = useState("")
    const headingRef = useRef(null)

    useEffect(() => { headingRef.current?.focus() }, [])

    const refreshStatus = useCallback(async () => {
        if (!orderCode || !access) {
            setError("This order link is incomplete. Return to the shop and contact the seller if you need help.")
            setChecking(false)
            return
        }
        try {
            const { data } = await axios.get(`${API_URL}/payments/orders/${encodeURIComponent(orderCode)}/status`, {
                params: { access, ...(transactionId ? { transactionId } : {}) },
            })
            setOrder(data)
            setError("")
            if (["paid", "stock_review", "payment_review"].includes(data.status)) {
                localStorage.removeItem(`storecraft:cart:${data.shopSlug}`)
                sessionStorage.removeItem(`storecraft:payment:${data.shopSlug}`)
                sessionStorage.removeItem(`storecraft:checkout:${data.shopSlug}`)
            }
        } catch (requestError) {
            setError(requestError.response?.data?.message || "We can’t confirm the payment status right now.")
        } finally {
            setChecking(false)
        }
    }, [access, orderCode, transactionId])

    useEffect(() => {
        let active = true
        let attempts = 0
        const check = async () => {
            if (!active) return
            attempts += 1
            await refreshStatus()
            if (active && attempts < 12) timer = window.setTimeout(check, 3000)
        }
        let timer = window.setTimeout(check, 0)
        return () => { active = false; window.clearTimeout(timer) }
    }, [refreshStatus])

    const retryPayment = async () => {
        setRetrying(true)
        setRetryError("")
        try {
            const { data } = await axios.post(`${API_URL}/payments/orders/${encodeURIComponent(orderCode)}/retry`, { access, provider })
            if (data.provider === "paystack" && data.accessCode) {
                const popup = new PaystackPop()
                popup.resumeTransaction(data.accessCode, {
                    onSuccess: () => {
                        setRetrying(false)
                        setChecking(true)
                        refreshStatus()
                    },
                    onCancel: () => setRetrying(false),
                    onError: (popupError) => {
                        setRetryError(popupError?.message || "Paystack could not open. Please try again.")
                        setRetrying(false)
                    },
                })
                setRetrying(false)
            } else {
                window.location.assign(data.checkoutUrl)
            }
        } catch (requestError) {
            setRetryError(requestError.response?.data?.message || "We couldn't reopen payment. Please try again.")
            setRetrying(false)
        }
    }

    const isPaid = order?.status === "paid"
    const needsReview = order?.status === "payment_review" || order?.status === "stock_review"
    const canRetry = order?.status === "pending_payment" && order?.paymentStatus !== "pending"

    return (
        <main className="storefront payment-return-page">
            <div className="storefront-shell">
                <a className="storefront-skip" href="#payment-result">Skip to payment status</a>
                <header className="storefront-topbar"><Link className="storefront-wordmark" to="/"><span className="storefront-mark" aria-hidden="true">S</span><span>StoreCraft</span></Link><span className="storefront-topbar-note">Order update</span></header>
                <section className={`payment-result${isPaid ? " payment-result--success" : needsReview ? " payment-result--review" : ""}`} id="payment-result" aria-live="polite" aria-busy={checking}>
                    <span className="payment-result-symbol" aria-hidden="true">{isPaid ? "✓" : needsReview ? "!" : "…"}</span>
                    <p className="storefront-kicker">{isPaid ? "Payment confirmed" : needsReview ? "We’re reviewing this payment" : "Secure checkout"}</p>
                    <h1 ref={headingRef} tabIndex="-1">{isPaid ? "Your order is in." : needsReview ? "Your order needs a quick review." : order?.paymentStatus === "failed" ? "Payment wasn’t confirmed." : "We’re confirming your payment."}</h1>
                    <p>{isPaid
                        ? "Your payment is verified and StoreCraft has recorded your order. Keep this page link to check its status."
                        : needsReview
                            ? "This payment needs review before the order can be confirmed. Please don’t pay again while it’s being checked."
                            : order?.paymentStatus === "failed"
                                ? "This payment attempt did not complete. You can safely try another payment method."
                                : "You can stay here while StoreCraft checks with the payment provider. This page can be reopened if you lose connection."}</p>
                    {order && <div className="payment-order-meta"><span>Order reference</span><strong>{order.orderCode}</strong><span>Order total</span><strong>{formatPrice(order.amountKobo)}</strong></div>}
                    {error && !order && <p className="payment-status-error" role="alert">{error}</p>}
                    {error && order && <p className="payment-status-error" role="status">Status refresh paused: {error}</p>}
                    {order?.paymentStatus === "pending" && !needsReview && !isPaid && <p className="payment-check-note" role="status">Checking with your payment provider…</p>}
                    {canRetry && (
                        <div className="payment-retry">
                            <label htmlFor="retry-provider">Try another provider</label>
                            <select id="retry-provider" value={provider} onChange={(event) => setProvider(event.target.value)}>
                                <option value="paystack">Paystack</option><option value="flutterwave">Flutterwave</option>
                            </select>
                            {retryError && <p className="checkout-error" role="alert">{retryError}</p>}
                            <button className="storefront-checkout storefront-checkout--active" type="button" disabled={retrying} onClick={retryPayment}>{retrying ? "Opening payment…" : `Retry with ${provider === "paystack" ? "Paystack" : "Flutterwave"}`}</button>
                        </div>
                    )}
                    {!isPaid && !needsReview && <button className="payment-refresh" type="button" onClick={() => { setChecking(true); refreshStatus() }}>Check payment status</button>}
                    {order?.shopSlug && <Link className="storefront-text-link" to={`/shop/${encodeURIComponent(order.shopSlug)}`}>Return to the shop</Link>}
                    {!order && !checking && <button className="payment-refresh" type="button" onClick={() => { setChecking(true); refreshStatus() }}>Try again</button>}
                    {checking && !order && <div className="checkout-skeleton" role="status"><span className="storefront-sr-only">Checking order status…</span></div>}
                </section>
                <footer className="storefront-footer"><span>StoreCraft</span><span>Payment status is confirmed by StoreCraft, not the redirect page.</span></footer>
            </div>
        </main>
    )
}

export default PaymentReturn
