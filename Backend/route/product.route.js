const express = require("express")
const productrouter = express.Router()

const Authverify = require("../middlewares/Authmiddleware")


const {addProduct, getallproduct} =  require("../controller/product.controller")

productrouter.post("/addproducts", Authverify,  addProduct)
productrouter.get("/fetch/product", getallproduct)


module.exports = productrouter

