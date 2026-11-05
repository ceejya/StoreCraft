const express = require("express")
const { receiveWebhook } = require("../controller/payment.controller")

const webhookRouter = express.Router()
webhookRouter.post("/paystack", express.raw({ type: "application/json", limit: "256kb" }), receiveWebhook("paystack"))
webhookRouter.post("/flutterwave", express.raw({ type: "application/json", limit: "256kb" }), receiveWebhook("flutterwave"))

module.exports = webhookRouter
