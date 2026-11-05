const mongoose = require("mongoose")

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "productscollection", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "userinfo", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceKobo: { type: Number, required: true, min: 0 },
    lineTotalKobo: { type: Number, required: true, min: 0 },
}, { _id: false })

const orderSchema = new mongoose.Schema({
    orderCode: { type: String, required: true, unique: true, index: true },
    checkoutKeyHash: { type: String, required: true, unique: true, select: false },
    shopSlug: { type: String, required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "userinfo", required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerPhone: { type: String, required: true, trim: true },
    deliveryAddress: { type: String, required: true, trim: true },
    deliveryCity: { type: String, required: true, trim: true },
    deliveryState: { type: String, required: true, trim: true },
    items: { type: [orderItemSchema], required: true },
    currency: { type: String, enum: ["NGN"], default: "NGN", required: true },
    subtotalKobo: { type: Number, required: true, min: 0 },
    totalKobo: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ["pending_payment", "payment_review", "paid", "stock_review", "processing", "fulfilled", "cancelled"],
        default: "pending_payment",
        index: true,
    },
    accessTokenHash: { type: String, required: true, select: false },
    stockDecrementedAt: { type: Date, default: null },
}, { timestamps: true })

module.exports = mongoose.model("orders", orderSchema)
