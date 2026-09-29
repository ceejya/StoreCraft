const express = require("express")
const app = express()
require("dotenv").config()
const connect = require("./database/db.connect")
const userrouter = require("./route/user.route")
const productrouter = require("./route/product.route")
const socket = require("socket.io")
const cors = require("cors")
const chatmodel = require("./module/chat.model")

app.use(cors({ origin: "*" }))
app.use(express.json({ limit: "50mb" }));
app.use("/user", userrouter)
app.use("/product", productrouter)



connect()
const port = 8004
const connection = app.listen(port, () => {
    console.log(`app started at port ${port}`);

})



const io = socket(connection, {
    cors: { origin: "*" }
})




io.on("connection", async (socket) => {
    console.log("a user connected");
    const recentchat = await chatmodel.find().populate("sender", "username")
    socket.emit("refreshmessage", recentchat)


    socket.on("sendmessage", async (incomingmessage) => {
        console.log(incomingmessage);
        const newchat = await chatmodel.create(incomingmessage)
        socket.emit("resend", incomingmessage)
    })
})













// const allmessage = await chatmodel.find().populate("sender", "username")
// socket.emit("sendallmessage", allmessage)