const usermodel = require("../module/user.model")
const bcryptjs = require("bcryptjs")
const sendemailVerification = require("../Utils/emailVerification");
const generateOtp = require("../Utils/Otp-generator")
const otpmodel = require("../module/otp.module");
const jwt = require("jsonwebtoken")
const cloudinary = require("../Utils/Cloudinary")


const Signup = async (req, res) => {

    try {
        console.log(req.body);
        const { username, password, email } = req.body

        if (!username || !password || !email) {


            return res.status(400).json({ message: "All fields are mandatory", status: false })

        }

        const hashedPassword = await bcryptjs.hash(password, 10)
        console.log(hashedPassword);


        const newUser = await usermodel.create({
            ...req.body,
            password: hashedPassword,
            isVerified: false,
        })
        if (newUser) {
            const verificationotp = generateOtp()
            await otpmodel.create({
                otp: verificationotp,
                email
            })


            const sentmail = await sendemailVerification(email, username, verificationotp)
            console.log(sentmail);

            return res.status(200).json({ message: "Sign up successful", status: true })

        }

    } catch (error) {
        console.log(error);
        if (error.message.includes('E11000 duplicate key error collection')) {
            return res.status(400).json({ message: 'user already exist', status: false })

        }
        return res.status(500).json({ message: error.message, status: false })


    }


}

const verifyOtp = async (req, res) => {
    try {
        const { otp, email } = req.body
        if (!otp) {
            return res.status(400).json({ message: "All fields are mandatory", status: false })
        }
        const existotp = await otpmodel.findOne({ otp })
        console.log(existotp);


        if (existotp) {
            const verifieduser = await usermodel.findOneAndUpdate(
                { email: existotp.email },
                { isVerified: true },
                { new: true }
            )
            if (verifieduser) {
                await otpmodel.findByIdAndDelete(existotp._id)
                return res.status(200).json({ message: "email verified", status: true })
            }

        }

    } catch (error) {
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
            const currentUser = await usermodel.findOne({ email: verifiedToken.email }).select("username email _id profilepicture")
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
        const token = await jwt.sign({ email }, process.env.JWT_SECERETKEY, { expiresIn: "2hr" })
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
        console.log(req.user);

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






module.exports = { Signup, Login, verifyOtp, Verifytoken, ProfileUpload }
