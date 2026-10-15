const jwt = require("jsonwebtoken")

const Authverify = async (req, res, next) => {
   try {
      const token = req.headers.authorization.split(" ")[1]
      if (!token) {
         return res.status(404).json({ message: "Invalid token", status: false })
      }
      const verifiedToken = await jwt.verify(token, process.env.JWT_SECERETKEY)
      console.log(verifiedToken);
   if (verifiedToken) {
      req.user = verifiedToken.email
      next()
      
   }
   } catch (error) {
      res.status(500).json({ message: error.message, status: false })
   }
} 




module.exports = Authverify