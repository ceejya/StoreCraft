const mongoose = require("mongoose")

const userschema = new mongoose.Schema({
    username: { type: String, trim: true, required: true },
    email: { type: String, trim: true, unique: true, required: true },
    password: { type: String, trim: true, required: true },
    shopName: { type: String, trim: true, unique: true, sparse: true },
    storeName: { type: String, trim: true },
    isVerified:{ type: Boolean, default:false},
     profilepicture:{
        imageurl:{type:String},
        publicId:{type:String}
    }
    
    
})



const userblurprint = mongoose.model("userinfo", userschema)



module.exports = userblurprint


