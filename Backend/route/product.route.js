const express = require("express")
const productrouter = express.Router()

const Authverify = require("../middlewares/Authmiddleware")


const { addProduct, getallproduct, getSellerProducts, getPublicStore } = require("../controller/product.controller")

productrouter.post("/addproducts", Authverify,  addProduct)
productrouter.get("/mine", Authverify, getSellerProducts)
productrouter.get("/store/:shopSlug", getPublicStore)
productrouter.get("/fetch/product", getallproduct)



module.exports = productrouter
