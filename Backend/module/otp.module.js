const mongoose = require("mongoose")

const otpschema = mongoose.Schema({
    otp: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 15 * 60 * 1000), index: { expires: 0 } },
})

const otpmodel = mongoose.model("otpcollection", otpschema)

module.exports = otpmodel
