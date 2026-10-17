const jwt = require("jsonwebtoken")

const Authverify = (req, res, next) => {
    const authorization = req.headers.authorization
    const bearerMatch = authorization?.trim().match(/^Bearer\s+(.+)$/i)

    if (!bearerMatch) {
        console.warn("Rejected request without a valid Bearer header", {
            method: req.method,
            path: req.originalUrl,
            authorizationHeaderPresent: Boolean(authorization),
            receivedScheme: authorization?.trim().split(/\s+/)[0] || null,
        })
        return res.status(401).json({
            message: "A Bearer token is required. Please log in.",
            status: false,
        })
    }

    const token = bearerMatch[1].trim()
    if (!token) {
        return res.status(401).json({
            message: "A Bearer token is required. Please log in.",
            status: false,
        })
    }

    try {
        const verifiedToken = jwt.verify(token, process.env.JWT_SECERETKEY)

        if (!verifiedToken.email) {
            return res.status(401).json({
                message: "This token has no account identity. Please log in again.",
                status: false,
            })
        }
       

        req.user = verifiedToken.email
        console.log(req.user)
        return next()
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            const decodedToken = jwt.decode(token)
            const tokenExpiresAt = decodedToken?.exp
                ? new Date(decodedToken.exp * 1000).toISOString()
                : null
            const serverTime = new Date().toISOString()

            console.warn("Expired login token received", {
                serverTime,
                tokenExpiresAt: tokenExpiresAt || "unknown",
            })

            return res.status(401).json({
                message: "Login token expired. Log in again and use the new token.",
                status: false,
                ...(process.env.NODE_ENV !== "production" && {
                    serverTime,
                    tokenExpiresAt,
                }),
            })
        }

        return res.status(401).json({
            message: "Invalid login token. Please log in again.",
            status: false,
        })
    }
}




module.exports = Authverify
