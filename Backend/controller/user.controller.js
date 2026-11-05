const usermodel = require("../module/user.model")
const bcryptjs = require("bcryptjs")
const sendemailVerification = require("../Utils/emailVerification");
const generateOtp = require("../Utils/Otp-generator")
const otpmodel = require("../module/otp.module");
const jwt = require("jsonwebtoken")
const cloudinary = require("../Utils/Cloudinary")

const toShopSlug = (name) => name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const createUniqueShopSlug = async (storeName, email) => {
    const baseSlug = toShopSlug(storeName) || "my-store"
    let shopName = baseSlug
    let suffix = 2

    while (await usermodel.exists({
        email: { $ne: email },
        $or: [{ shopName }, { shopSlugHistory: shopName }],
    })) {
        shopName = `${baseSlug}-${suffix}`
        suffix += 1
    }

    return shopName
}

const ensureShopIdentity = async (user) => {
    if (user.shopName && user.storeName) return user

    const storeName = user.storeName || `${user.username}'s Store`
    const shopName = user.shopName || await createUniqueShopSlug(storeName, user.email)

    return usermodel.findByIdAndUpdate(
        user._id,
        { $set: { storeName, shopName } },
        { new: true, runValidators: true }
    ).select("username email _id profilepicture storeName shopName")
}
 

const Signup = async (req, res) => {
    try {
        const { username, password } = req.body
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : ""
        const normalizedUsername = typeof username === "string" ? username.trim() : ""

        if (!normalizedUsername || typeof password !== "string" || password.length < 6 || !email) {
            return res.status(400).json({ message: "All fields are mandatory", status: false })
        }

        const existingUser = await usermodel.findOne({ email })

        if (existingUser?.isVerified) {
            return res.status(409).json({
                message: "An account with this email already exists. Please log in.",
                status: false,
            })
        }

        const passwordHash = await bcryptjs.hash(password, 10)
        const storeName = `${normalizedUsername}'s Store`
        const shopName = existingUser?.shopName || await createUniqueShopSlug(storeName, email)

        if (existingUser) {
            existingUser.username = normalizedUsername
            existingUser.password = passwordHash
            existingUser.storeName = storeName
            existingUser.shopName = shopName
            existingUser.isVerified = false 
            await existingUser.save()
        } else {
            await usermodel.create({
                username: normalizedUsername,
                email,
                password: passwordHash,
                storeName,
                shopName,
                isVerified: false,
            })
        }

        const verificationotp = generateOtp()
        await otpmodel.findOneAndUpdate(
            { email },
            {
                $set: {
                    otp: verificationotp,
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        try {
            await sendemailVerification(email, normalizedUsername, verificationotp)
        } catch (error) {
            console.error("Could not send signup verification email:", {
                code: error.code,
                responseCode: error.responseCode,
                command: error.command,
                message: error.message,
            })
            return res.status(503).json({
                message: error.code === "EMAIL_CONFIG_MISSING"
                    ? "Your account is saved but email verification is not configured on the server. Please contact support."
                    : "Your account is saved but we couldn't send the verification code. Submit signup again with the same email to request a new code.",
                status: false,
            })
        }

        return res.status(200).json({
            message: existingUser
                ? "A new verification code was sent to your email"
                : "Verification code sent. Confirm your email to finish creating your account.",
            status: true,
        })
    } catch (error) {
        if (error.code === 11000) {
            const duplicateFields = Object.keys(error.keyPattern || {})
            const message = duplicateFields.length
                ? `A record with this ${duplicateFields.join(" and ")} already exists`
                : "A record with a duplicate unique value already exists"
            return res.status(400).json({ message, status: false })
        }
        console.error("Signup failed:", error.message)
        return res.status(500).json({ message: error.message, status: false })


    }


}

const verifyOtp = async (req, res) => {
    try {
        const otp = typeof req.body.otp === "string" ? req.body.otp.trim().toUpperCase() : ""
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : ""
        if (!otp || !email) {
            return res.status(400).json({ message: "Email and verification code are required.", status: false })
        }
        const pendingSignup = await otpmodel.findOne({ email, otp })
        if (!pendingSignup || !pendingSignup.expiresAt || pendingSignup.expiresAt <= new Date()) {
            return res.status(400).json({ message: "That verification code is invalid or expired. Request a new code and try again.", status: false })
        }

        const user = await usermodel.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: "Signup details were not found. Please sign up again.", status: false })
        }
        if (user.isVerified) {
            await otpmodel.deleteOne({ _id: pendingSignup._id })
            return res.status(200).json({ message: "Email is already verified. Please log in.", status: true })
        }

        user.isVerified = true
        await user.save()
        await otpmodel.deleteOne({ _id: pendingSignup._id })
        return res.status(200).json({ message: "Email verified. You can now log in.", status: true })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "That email or shop name is already in use. Please try signing up again.", status: false })
        }
        return res.status(500).json({ message: error.message, status: false })

    }
}


const Verifytoken = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        console.log(token);
        if (!token) {
            return res.status(400).json({ message: "invalid token", status: false })
        }
        const verifiedToken = await jwt.verify(token, process.env.JWT_SECERETKEY)
        if (verifiedToken) {
            const user = await usermodel.findOne({ email: verifiedToken.email }).select("username email _id profilepicture storeName shopName")
            const currentUser = user ? await ensureShopIdentity(user) : null
            console.log(currentUser);
            return res.status(200).json({ message: "token verified", currentUser, status: true })
        }
    } catch (error) {
        console.log(error);
        if (error.message.includes("buffering timed out")) {
            return res.status(500).json({ message: "Network Error", status: false })
        }
        return res.status(500).json({ message: error.message, status: false })
    }
}




const Login = async (req, res) => {
    try {
        console.log(req.body);
        const { email, password } = req.body


        if (!email || !password) {
            return res.status(400).json({ message: "All fields are mandatory", status: false })
        }

        const existingUser = await usermodel.findOne({ email })

        if (!existingUser) {
            return res.status(404).json({ message: "user not found", status: false });
        }
        const correctPassword = await bcryptjs.compare(password, existingUser.password)
        if (!correctPassword) {
            return res.status(404).json({ message: "Incorrect username or password", status: false })
        }

        if (!existingUser.isVerified) {
            return res.status(400).json({ message: "email is not verified, check your mail.", status: false });
        }
        const token = await jwt.sign({ email }, process.env.JWT_SECERETKEY, { expiresIn: "7d" })
        return res.status(200).json({ message: "login successful", token, status: true });

    } catch (error) {
        console.log(error);
        if (error.message.includes('E11000 duplicate key error collection')) {
            return res.status(400).json({ message: 'user already exist', status: false })
        }
        return res.status(500).json({ message: error.message, status: false })
    }
}

const ProfileUpload = async (req, res) => {
    try {
        const { image } = req.body
        const email = req.user


        if (!image) {
            return res.status(500).json({ message: "image is empty", status: false })
        }

        const existuser = await usermodel.findOne({ email })
        console.log(existuser);
        const imageid = existuser.profilepicture?.publicId
        console.log(imageid, "image public id");

        if (imageid) {
            await cloudinary.uploader.destroy(imageid)
        }

        const uploadedimage = await cloudinary.uploader.upload(image)
        console.log(uploadedimage);
        const profileUpdate = usermodel.findByIdAndUpdate(
            { email },
            { profilepicture: { imageurl: uploadedimage.secure_url, publicId: uploadedimage.public_id } },
            { new: true }

        )
        if (profileUpdate) {
            return res.status(200).json({ message: "profile picture updated successfully" })

        }



    } catch (error) {
        return res.status(500).json({ message: error.message, status: false })
        console.log(error);


    }
}

const UpdateShopName = async (req, res) => {
    try {
        const email = req.user;
        const { storeName } = req.body ?? {};

       

        if (typeof storeName !== "string" || !storeName.trim()) {
            return res.status(400).json({
                message: "Store name cannot be empty.",
                status: false,
            });
        }

        const cleanStoreName = storeName.trim();
        const baseSlug = toShopSlug(cleanStoreName)

        if (!baseSlug) {
            return res.status(400).json({
                message: "Use a shop name with letters or numbers.",
                status: false,
            });
        }

        const existingUser = await usermodel.findOne({ email }).select("shopName")
        if (!existingUser) {
            return res.status(404).json({
                message: "Seller account not found.",
                status: false,
            })
        }

        const shopName = await createUniqueShopSlug(cleanStoreName, email)
        const update = { $set: { storeName: cleanStoreName, shopName } }
        if (existingUser.shopName && existingUser.shopName !== shopName) {
            update.$addToSet = { shopSlugHistory: existingUser.shopName }
        }

        const updatedUser = await usermodel.findOneAndUpdate(
            { email },
            update,
            { new: true, runValidators: true }
        ).select("username storeName shopName");

        if (!updatedUser) {
            return res.status(404).json({
                message: "Seller account not found.",
                status: false,
            });
        }

        return res.status(200).json({
            message: "Shop name saved.",
            currentUser: updatedUser,
            status: true,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false,
        });
    }
};





module.exports = { Signup, Login, verifyOtp, Verifytoken, ProfileUpload, UpdateShopName }
