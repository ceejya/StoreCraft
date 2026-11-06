const crypto = require("crypto")

const jsonRequest = async (url, options) => {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
        const error = new Error(body.message || "The payment provider could not complete the request.")
        error.providerStatus = response.status
        throw error
    }
    return body
}

const frontendUrl = () => (process.env.STOREFRONT_URL || process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")[0].trim().replace(/\/$/, "")

const callbackUrl = (order, accessToken) => {
    const url = new URL("/payment-return", frontendUrl())
    url.searchParams.set("order", order.orderCode)
    url.searchParams.set("access", accessToken)
    return url.toString()
}

const initializePayment = async ({ provider, order, payment, accessToken }) => {
    const redirectUrl = callbackUrl(order, accessToken)

    if (provider === "paystack") {
        if (!process.env.PAYSTACK_SECRET_KEY) throw new Error("Paystack is not configured on the server.")
        const result = await jsonRequest("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: order.customerEmail,
                amount: String(payment.expectedAmountKobo),
                currency: "NGN",
                reference: payment.reference,
                callback_url: redirectUrl,
                metadata: { order_code: order.orderCode },
            }),
        })
        if (!result.status || !result.data?.authorization_url || !result.data?.access_code) {
            throw new Error("Paystack did not return the checkout details.")
        }
        return {
            checkoutUrl: result.data.authorization_url,
            accessCode: result.data.access_code,
            providerTransactionId: null,
        }
    }

    if (provider === "flutterwave") {
        if (!process.env.FLUTTERWAVE_SECRET_KEY) throw new Error("Flutterwave is not configured on the server.")
        const result = await jsonRequest("https://api.flutterwave.com/v3/payments", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                tx_ref: payment.reference,
                amount: (payment.expectedAmountKobo / 100).toFixed(2),
                currency: "NGN",
                redirect_url: redirectUrl,
                customer: {
                    email: order.customerEmail,
                    name: order.customerName,
                    phonenumber: order.customerPhone,
                },
                meta: { order_code: order.orderCode },
                customizations: { title: "StoreCraft", description: `Order ${order.orderCode}` },
            }),
        })
        if (result.status !== "success" || !result.data?.link) throw new Error("Flutterwave did not return a checkout link.")
        return { checkoutUrl: result.data.link, providerTransactionId: null }
    }

    throw new Error("Choose Paystack or Flutterwave to continue.")
}

const verifyPayment = async ({ provider, payment, providerTransactionId }) => {
    if (provider === "paystack") {
        const result = await jsonRequest(`https://api.paystack.co/transaction/verify/${encodeURIComponent(payment.reference)}`, {
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
        })
        const transaction = result.data
        return {
            successful: result.status === true && transaction?.status === "success",
            reference: transaction?.reference,
            amountKobo: Number(transaction?.amount),
            currency: transaction?.currency,
            transactionId: transaction?.id ? String(transaction.id) : null,
            pending: transaction?.status === "pending",
        }
    }

    if (provider === "flutterwave") {
        if (!providerTransactionId) return { successful: false, pending: true }
        const result = await jsonRequest(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(providerTransactionId)}/verify`, {
            headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
        })
        const transaction = result.data
        const amountKobo = Math.round(Number(transaction?.amount) * 100)
        return {
            successful: result.status === "success" && transaction?.status === "successful",
            reference: transaction?.tx_ref,
            amountKobo,
            currency: transaction?.currency,
            transactionId: transaction?.id ? String(transaction.id) : String(providerTransactionId),
            pending: transaction?.status === "pending",
        }
    }

    throw new Error("Unsupported payment provider.")
}

const safeEqual = (received, expected) => {
    if (!received || !expected) return false
    const left = Buffer.from(String(received))
    const right = Buffer.from(String(expected))
    return left.length === right.length && crypto.timingSafeEqual(left, right)
}

const validWebhook = ({ provider, rawBody, headers }) => {
    if (provider === "paystack") {
        const signature = headers["paystack-signature"]
        const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET
        if (signature && webhookSecret && signature.startsWith("t=")) {
            const parts = signature.split(",")
            const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2)
            const seconds = Number(timestamp)
            if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false
            const candidates = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3))
            const expected = crypto.createHmac("sha512", webhookSecret).update(`${timestamp}.`).update(rawBody).digest("hex")
            if (candidates.some((candidate) => safeEqual(candidate.slice(candidate.indexOf(":") + 1), expected))) return true
        }

        const secret = process.env.PAYSTACK_SECRET_KEY
        const legacySignature = headers["x-paystack-signature"]
        if (!secret || !legacySignature) return false
        // Legacy Paystack events use HMAC-SHA512 over the exact raw body.
        const legacyExpected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex")
        return safeEqual(legacySignature, legacyExpected)
    }

    if (provider === "flutterwave") {
        const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH
        if (!secretHash) return false
        const signature = headers["flutterwave-signature"]
        if (signature) {
            const expected = crypto.createHmac("sha256", secretHash).update(rawBody).digest("base64")
            return safeEqual(signature, expected)
        }
        return safeEqual(headers["verif-hash"], secretHash)
    }

    return false
}

module.exports = { initializePayment, verifyPayment, validWebhook }
