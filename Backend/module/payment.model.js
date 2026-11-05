const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: "orders", required: true, index: true },
    provider: { type: String, enum: ["paystack", "flutterwave"], required: true },
    reference: { type: String, required: true, unique: true, index: true },
    providerTransactionId: { type: String, default: null },
    currency: { type: String, enum: ["NGN"], default: "NGN", required: true },
    expectedAmountKobo: { type: Number, required: true, min: 1 },
    receivedAmountKobo: { type: Number, default: null, min: 0 },
    status: {
        type: String,
        enum: ["pending", "successful", "failed", "amount_mismatch", "initialization_failed"],
        default: "pending",
        index: true,
    },
    checkoutUrl: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    lastCheckedAt: { type: Date, default: null },
}, { timestamps: true })

module.exports = mongoose.model("payments", paymentSchema)
