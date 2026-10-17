const express = require("express")

const userrouter = express.Router()

const { Signup, Login, verifyOtp, Verifytoken, ProfileUpload, UpdateShopName } = require("../controller/user.controller")
const Authverify = require("../middlewares/Authmiddleware")


userrouter.post("/signup", Signup)
userrouter.post("/login", Login)
userrouter.post("/verifyotp", verifyOtp)
userrouter.get("/verifytoken", Verifytoken)
userrouter.patch("/upload", Authverify, ProfileUpload)
userrouter.patch("/shop-name", Authverify, UpdateShopName)


module.exports = userrouter

