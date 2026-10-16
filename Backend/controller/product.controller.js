const cloudinary = require("../Utils/Cloudinary")
const productmodel = require("../module/product.model")
const usermodel = require("../module/user.model")


const addProduct = async (req, res) => {
    try {
        const { productname, productprice, productdescription, productimage, stock } = req.body

        if (!productname || !productprice || !productdescription || !productimage || !stock) {
            return res.status(400).json({ message: "All fields are mandatory", status: false })
        }

        const seller = await usermodel.findOne({email: req.user}).select("_id");
        console.log(seller);
        

        if (!seller) {
            return res.status(400).json({ message: "session expired"})
            
        }
       

        const uploadedimage = await cloudinary.uploader.upload(productimage, { folder: "productspage" })
        console.log(uploadedimage);
        const newProduct = await productmodel.create({ ...req.body,seller: seller._id, productimage: uploadedimage.secure_url })
        if (newProduct) {
            return res.status(200).json({ message: "created product", status: true })
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message, status: false })
    }
}

const getallproduct = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 6

        const skip = (page - 1) * limit

        const totalProducts = await productmodel.countDocuments()
        const allproducts = await productmodel.find().skip(skip).limit(limit)

        return res.status(200).json({
            message: "Products fetched successfully",
            allproducts,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
            status: true
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message, status: false })
    }
}
  


module.exports = { addProduct, getallproduct }