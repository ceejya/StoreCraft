const express = require("express")
const app = express()
require("dotenv").config()
const connect = require("./database/db.connect")
const userrouter = require("./route/user.route")
const productrouter = require("./route/product.route")
const socket = require("socket.io")
const cors = require("cors")
const chatmodel = require("./module/chat.model")

// Comma-separated list, e.g. "https://storecraft.vercel.app,http://localhost:5173"
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean)

const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser requests (curl, Render health checks) with no Origin header
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
        return callback(new Error(`Origin ${origin} not allowed by CORS`))
    },
    credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json({ limit: "50mb" }))
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }))
app.use("/user", userrouter)
app.use("/product", productrouter)

const port = process.env.PORT || 8004

const startServer = async () => {
    try {
        // Do not accept HTTP or socket requests until MongoDB is ready.
        await connect()

        const connection = app.listen(port, () => {
            console.log(`app started at port ${port}`)
        })

        const io = socket(connection, {
            cors: { origin: allowedOrigins, credentials: true }
        })

        io.on("connection", async (clientSocket) => {
            console.log("a user connected")

            try {
                const recentchat = await chatmodel.find().populate("sender", "username")
                clientSocket.emit("refreshmessage", recentchat)
            } catch (error) {
                console.error("Could not load recent chat messages:", error.message)
                clientSocket.emit("chaterror", { message: "Could not load chat messages" })
            }

            clientSocket.on("sendmessage", async (incomingmessage) => {
                try {
                    const newchat = await chatmodel.create(incomingmessage)
                    clientSocket.emit("resend", newchat)
                } catch (error) {
                    console.error("Could not save chat message:", error.message)
                    clientSocket.emit("chaterror", { message: "Could not send chat message" })
                }
            })
        })
    } catch (error) {
        console.error("Server could not start because MongoDB is unavailable:", error.message)
        process.exit(1)
    }
}

startServer()
