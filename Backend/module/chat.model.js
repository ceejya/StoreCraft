const mongoose = require("mongoose")

const chatschema = mongoose.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "userinfo" },
}, { timestamps: true })

const chatdata = mongoose.model("chatcollection", chatschema)

module.exports = chatdata
