const crypto = require("crypto")
const mongoose = require("mongoose")
const Order = require("../module/order.model")
const Payment = require("../module/payment.model")
const Product = require("../module/product.model")
const User = require("../module/user.model")
const { initializePayment, verifyPayment, validWebhook } = require("../Utils/paymentProviders")

const normalizeAmountToKobo = (amount) => {
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return null
    const kobo = Math.round(numericAmount * 100)
    if (Math.abs(numericAmount * 100 - kobo) > 0.000001) return null
    return kobo
}

const hashAccessToken = (token) => crypto.createHash("sha256").update(token).digest("hex")
const validAccessToken = (provided, storedHash) => {
    if (typeof provided !== "string" || !storedHash) return false
    const providedHash = Buffer.from(hashAccessToken(provided), "hex")
    const savedHash = Buffer.from(storedHash, "hex")
    return providedHash.length === savedHash.length && crypto.timingSafeEqual(providedHash, savedHash)
}

const paymentLaunchData = (payment, orderCode) => payment.provider === "paystack" && payment.accessCode
    ? { provider: payment.provider, accessCode: payment.accessCode, orderCode }
    : { provider: payment.provider, checkoutUrl: payment.checkoutUrl, orderCode }

const beginAttempt = async ({ order, provider, accessToken, res }) => {
    const payment = await Payment.create({
        order: order._id,
        provider,
        reference: `sc-${crypto.randomBytes(18).toString("hex")}`,
        expectedAmountKobo: order.totalKobo,
        currency: "NGN",
    })

    try {
        const initialized = await initializePayment({ provider, order, payment, accessToken })
        payment.checkoutUrl = initialized.checkoutUrl
        payment.accessCode = initialized.accessCode || null
        payment.providerTransactionId = initialized.providerTransactionId
        await payment.save()
        return res.status(201).json(paymentLaunchData(payment, order.orderCode))
    } catch (error) {
        payment.status = "initialization_failed"
        await payment.save()
        if (order.status === "pending_payment") {
            order.status = "pending_payment"
            await order.save()
        }
        console.error(`Payment initialization failed (${provider}):`, error.message)
        return res.status(502).json({
            message: "We couldn't open the payment page. Your order is saved; you can safely try again.",
            orderCode: order.orderCode,
            accessToken,
            status: false,
        })
    }
}

const createCheckout = async (req, res) => {
    try {
        const { shopSlug } = req.params
        const {
            customerName, email, phone, address, city, state, provider,
            items, checkoutKey,
        } = req.body || {}
        const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : ""
        const allowedProviders = ["paystack", "flutterwave"]

        if (!shopSlug || typeof customerName !== "string" || customerName.trim().length < 2
            || !/^\S+@\S+\.\S+$/.test(cleanEmail)
            || typeof phone !== "string" || phone.trim().length < 7
            || typeof address !== "string" || address.trim().length < 5
            || typeof city !== "string" || !city.trim()
            || typeof state !== "string" || !state.trim()
            || !allowedProviders.includes(provider)
            || typeof checkoutKey !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(checkoutKey)
            || !Array.isArray(items) || items.length < 1 || items.length > 30) {
            return res.status(400).json({ message: "Enter valid contact, delivery, cart, and payment details.", status: false })
        }

        const seller = await User.findOne({ $or: [{ shopName: shopSlug }, { shopSlugHistory: shopSlug }] }).select("_id shopName")
        if (!seller) return res.status(404).json({ message: "This shop could not be found.", status: false })

        const checkoutKeyHash = hashAccessToken(checkoutKey)
        const existingOrder = await Order.findOne({ checkoutKeyHash }).select("+accessTokenHash +checkoutKeyHash")
        if (existingOrder) {
            const latestPayment = await Payment.findOne({ order: existingOrder._id }).select("+accessCode").sort({ createdAt: -1 })
            if (latestPayment?.status === "pending" && (latestPayment.checkoutUrl || latestPayment.accessCode)) {
                return res.status(200).json(paymentLaunchData(latestPayment, existingOrder.orderCode))
            }
            if (existingOrder.status === "pending_payment") {
                return res.status(200).json({
                    orderCode: existingOrder.orderCode,
                    accessToken: checkoutKey,
                    message: "This checkout is saved. Continue by retrying payment.",
                    status: false,
                })
            }
            return res.status(200).json({
                statusUrl: `/payment-return?order=${encodeURIComponent(existingOrder.orderCode)}&access=${encodeURIComponent(checkoutKey)}`,
                orderCode: existingOrder.orderCode,
            })
        }

        const quantities = new Map()
        for (const item of items) {
            const productId = String(item?.productId || "")
            const quantity = Number(item?.quantity)
            if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
                return res.status(400).json({ message: "One or more cart items are invalid. Please review your bag.", status: false })
            }
            quantities.set(productId, (quantities.get(productId) || 0) + quantity)
        }
        if ([...quantities.values()].some((quantity) => quantity > 99)) {
            return res.status(400).json({ message: "A product quantity exceeds the checkout limit.", status: false })
        }

        const products = await Product.find({ _id: { $in: [...quantities.keys()] }, seller: seller._id })
        if (products.length !== quantities.size) {
            return res.status(409).json({ message: "A product in your bag is no longer available in this shop. Please refresh and review your bag.", status: false })
        }

        const orderItems = []
        let totalKobo = 0
        for (const product of products) {
            const quantity = quantities.get(String(product._id))
            const unitPriceKobo = normalizeAmountToKobo(product.productprice)
            if (unitPriceKobo === null) {
                return res.status(409).json({ message: `${product.productname} has a price that needs the seller's attention.`, status: false })
            }
            if (Number(product.stock) < quantity) {
                return res.status(409).json({ message: `Only ${product.stock} ${product.productname} currently available. Please update your bag.`, status: false })
            }
            const lineTotalKobo = unitPriceKobo * quantity
            totalKobo += lineTotalKobo
            orderItems.push({
                product: product._id,
                seller: seller._id,
                name: product.productname,
                image: product.productimage,
                quantity,
                unitPriceKobo,
                lineTotalKobo,
            })
        }
        if (!Number.isSafeInteger(totalKobo) || totalKobo < 1) {
            return res.status(400).json({ message: "The order total is invalid. Please review your bag.", status: false })
        }

        const accessToken = checkoutKey
        const order = await Order.create({
            orderCode: `SC-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
            checkoutKeyHash,
            shopSlug: seller.shopName,
            seller: seller._id,
            customerName: customerName.trim().slice(0, 120),
            customerEmail: cleanEmail,
            customerPhone: phone.trim().slice(0, 40),
            deliveryAddress: address.trim().slice(0, 300),
            deliveryCity: city.trim().slice(0, 100),
            deliveryState: state.trim().slice(0, 100),
            items: orderItems,
            subtotalKobo: totalKobo,
            totalKobo,
            accessTokenHash: checkoutKeyHash,
        })

        return beginAttempt({ order, provider, accessToken, res })
    } catch (error) {
        if (error.code === 11000 && typeof req.body?.checkoutKey === "string") {
            const duplicate = await Order.findOne({ checkoutKeyHash: hashAccessToken(req.body.checkoutKey) })
                .select("+accessTokenHash +checkoutKeyHash")
            if (duplicate) {
                const payment = await Payment.findOne({ order: duplicate._id }).select("+accessCode").sort({ createdAt: -1 })
                if (payment?.status === "pending" && (payment.checkoutUrl || payment.accessCode)) {
                    return res.status(200).json(paymentLaunchData(payment, duplicate.orderCode))
                }
                return res.status(200).json({ orderCode: duplicate.orderCode, accessToken: req.body.checkoutKey, status: false })
            }
        }
        console.error("Could not create checkout:", error.message)
        return res.status(500).json({ message: "We couldn't prepare checkout. Please try again.", status: false })
    }
}

const markPaymentVerified = async (payment, verified) => {
    const order = await Order.findById(payment.order)
    if (!order) throw new Error("Payment order was not found.")

    if (payment.status === "successful" || payment.status === "amount_mismatch") return { order, payment }
    if (!verified.successful) {
        if (!verified.pending && payment.status === "pending") {
            payment.status = "failed"
            payment.providerTransactionId = verified.transactionId || payment.providerTransactionId
            await payment.save()
        }
        return { order, payment }
    }

    payment.providerTransactionId = verified.transactionId || payment.providerTransactionId
    payment.receivedAmountKobo = Number.isSafeInteger(verified.amountKobo) ? verified.amountKobo : null
    payment.verifiedAt = new Date()

    const matchesOrder = verified.reference === payment.reference
        && verified.currency === "NGN"
        && verified.amountKobo === payment.expectedAmountKobo
        && verified.amountKobo === order.totalKobo

    if (!matchesOrder) {
        payment.status = "amount_mismatch"
        order.status = "payment_review"
        await Promise.all([payment.save(), order.save()])
        return { order, payment }
    }

    const session = await mongoose.startSession()
    try {
        await session.withTransaction(async () => {
            const currentPayment = await Payment.findById(payment._id).session(session)
            const currentOrder = await Order.findById(order._id).session(session)
            if (!currentPayment || !currentOrder) throw new Error("Payment order could not be loaded.")
            if (["successful", "amount_mismatch"].includes(currentPayment.status)) return

            if (currentOrder.stockDecrementedAt || currentOrder.status === "paid" || currentOrder.status === "payment_review") {
                currentPayment.status = "amount_mismatch"
                currentPayment.providerTransactionId = verified.transactionId || currentPayment.providerTransactionId
                currentPayment.receivedAmountKobo = verified.amountKobo
                currentPayment.verifiedAt = new Date()
                currentOrder.status = "payment_review"
                await Promise.all([currentPayment.save({ session }), currentOrder.save({ session })])
                return
            }

            currentPayment.status = "successful"
            currentPayment.providerTransactionId = verified.transactionId || currentPayment.providerTransactionId
            currentPayment.receivedAmountKobo = verified.amountKobo
            currentPayment.verifiedAt = new Date()

            if (currentOrder.stockDecrementedAt) {
                currentOrder.status = "paid"
                await Promise.all([currentPayment.save({ session }), currentOrder.save({ session })])
                return
            }

            const stockChecks = await Promise.all(currentOrder.items.map((item) => Product.exists({
                _id: item.product,
                seller: item.seller,
                stock: { $gte: item.quantity },
            }).session(session)))

            if (stockChecks.some((available) => !available)) {
                currentOrder.status = "stock_review"
                await Promise.all([currentPayment.save({ session }), currentOrder.save({ session })])
                return
            }

            for (const item of currentOrder.items) {
                const updated = await Product.updateOne(
                    { _id: item.product, seller: item.seller, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                    { session },
                )
                if (updated.modifiedCount !== 1) throw new Error("Stock changed while confirming payment.")
            }

            currentOrder.stockDecrementedAt = new Date()
            currentOrder.status = "paid"
            await Promise.all([currentPayment.save({ session }), currentOrder.save({ session })])
        })
    } finally {
        await session.endSession()
    }

    return {
        order: await Order.findById(order._id),
        payment: await Payment.findById(payment._id),
    }
}

const getOrderStatus = async (req, res) => {
    try {
        const order = await Order.findOne({ orderCode: req.params.orderCode }).select("+accessTokenHash")
        if (!order || !validAccessToken(req.query.access, order.accessTokenHash)) {
            return res.status(404).json({ message: "We couldn't find this order. Check the link and try again.", status: false })
        }

        let payment = await Payment.findOne({ order: order._id }).sort({ createdAt: -1 })
        const shouldCheckProvider = payment?.status === "pending"
            && (!payment.lastCheckedAt || Date.now() - payment.lastCheckedAt.getTime() > 15000)
        if (shouldCheckProvider && req.query.transactionId && payment.provider === "flutterwave") {
            payment.lastCheckedAt = new Date()
            await payment.save()
            const verified = await verifyPayment({
                provider: payment.provider,
                payment,
                providerTransactionId: String(req.query.transactionId),
            })
            ;({ order, payment } = await markPaymentVerified(payment, verified))
        } else if (shouldCheckProvider && payment.provider === "paystack") {
            payment.lastCheckedAt = new Date()
            await payment.save()
            const verified = await verifyPayment({ provider: payment.provider, payment })
            ;({ order, payment } = await markPaymentVerified(payment, verified))
        }

        return res.status(200).json({
            orderCode: order.orderCode,
            shopSlug: order.shopSlug,
            status: order.status,
            paymentStatus: payment?.status || "pending",
            provider: payment?.provider || null,
            amountKobo: order.totalKobo,
            currency: order.currency,
        })
    } catch (error) {
        console.error("Could not retrieve order status:", error.message)
        return res.status(503).json({ message: "We can't confirm your payment right now. Please try again shortly.", status: false })
    }
}

const retryPayment = async (req, res) => {
    try {
        const { provider, access } = req.body || {}
        const order = await Order.findOne({ orderCode: req.params.orderCode }).select("+accessTokenHash")
        if (!order || !validAccessToken(access, order.accessTokenHash)) {
            return res.status(404).json({ message: "We couldn't find this order. Check the link and try again.", status: false })
        }
        if (order.status !== "pending_payment") {
            return res.status(409).json({ message: "This order can no longer start another payment attempt.", status: false })
        }
        if (!["paystack", "flutterwave"].includes(provider)) {
            return res.status(400).json({ message: "Choose Paystack or Flutterwave to continue.", status: false })
        }
        const latestPayment = await Payment.findOne({ order: order._id }).select("+accessCode").sort({ createdAt: -1 })
        if (latestPayment?.status === "pending") {
            if (latestPayment.provider === "paystack" && latestPayment.accessCode) {
                return res.status(200).json(paymentLaunchData(latestPayment, order.orderCode))
            }
            return res.status(409).json({ message: "A payment attempt is still being confirmed. Refresh the order status before trying again.", status: false })
        }
        return beginAttempt({ order, provider, accessToken: access, res })
    } catch (error) {
        console.error("Could not retry payment:", error.message)
        return res.status(500).json({ message: "We couldn't restart payment. Please try again.", status: false })
    }
}

const receiveWebhook = (provider) => async (req, res) => {
    const rawBody = req.body
    if (!Buffer.isBuffer(rawBody) || !validWebhook({ provider, rawBody, headers: req.headers })) {
        return res.status(401).send("Invalid webhook signature")
    }

    try {
        const payload = JSON.parse(rawBody.toString("utf8"))
        const data = payload.data || {}
        const reference = provider === "paystack" ? data.reference : data.tx_ref
        const payment = reference ? await Payment.findOne({ provider, reference }) : null
        if (!payment) return res.sendStatus(200)

        if (provider === "paystack" && payload.event !== "charge.success") return res.sendStatus(200)
        if (provider === "flutterwave" && payload.event !== "charge.completed") return res.sendStatus(200)

        if (provider === "flutterwave" && data.status !== "successful") {
            if (payment.status === "pending") {
                payment.status = "failed"
                payment.providerTransactionId = data.id ? String(data.id) : null
                await payment.save()
            }
            return res.sendStatus(200)
        }

            payment.lastCheckedAt = new Date()
            await payment.save()
            const verified = await verifyPayment({
            provider,
            payment,
            providerTransactionId: provider === "flutterwave" ? String(data.id || "") : undefined,
        })
        await markPaymentVerified(payment, verified)
        return res.sendStatus(200)
    } catch (error) {
        console.error(`${provider} webhook processing failed:`, error.message)
        return res.sendStatus(500)
    }
}

module.exports = { createCheckout, getOrderStatus, retryPayment, receiveWebhook }
