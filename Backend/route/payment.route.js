const express = require("express")
const { createCheckout, getOrderStatus, retryPayment } = require("../controller/payment.controller")

const paymentRouter = express.Router()

paymentRouter.post("/orders/:orderCode/retry", retryPayment)
paymentRouter.get("/orders/:orderCode/status", getOrderStatus)
paymentRouter.post("/store/:shopSlug/checkout", createCheckout)

module.exports = paymentRouter
