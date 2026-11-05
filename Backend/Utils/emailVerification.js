const nodemailer = require("nodemailer")

const sendemailVerification = async  (email, username, otp) => {
    const emailUser = process.env.EMAIL_USER?.trim()
    const emailPass = process.env.EMAIL_PASS?.trim()
    if (!emailUser || !emailPass) {
        const error = new Error("EMAIL_USER and EMAIL_PASS must be configured before sending verification email.")
        error.code = "EMAIL_CONFIG_MISSING"
        throw error
    }

    const messageTemplate = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fc;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%); padding: 40px 40px; text-align: center; border-radius: 12px 12px 0 0;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 1px;">
                                    ✉️ Email Verification
                                </h1>
                            </td>
                        </tr>
                        
                        <!-- Body Content -->
                        <tr>
                            <td style="padding: 50px 40px;">
                                <p style="color: #333333; font-size: 18px; margin: 0 0 10px 0;">
                                    Hello <strong style="color: #1e88e5;">${username || 'User'}</strong>,
                                </p>
                                <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                                    Thank you for registering with us! To complete your registration and verify your email address, please use the verification code below:
                                </p>
                                
                                <!-- Verification Code Box -->
                                <table role="presentation" style="width: 100%; margin: 30px 0;">
                                    <tr>
                                        <td align="center">
                                            <div style="background-color: #e3f2fd; border: 2px dashed #1e88e5; border-radius: 10px; padding: 25px 40px; display: inline-block;">
                                                <span style="font-size: 36px; font-weight: 700; color: #1565c0; letter-spacing: 8px;">${otp}
                                                   
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                                    This verification code will expire in <strong style="color: #1e88e5;">15 minutes</strong>. If you did not create an account, please ignore this email.
                                </p>
                                
                                <!-- Divider -->
                                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                                
                                <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 0;">
                                    For security reasons, never share this code with anyone. Our team will never ask for your verification code.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e8e8e8;">
                                <p style="color: #1e88e5; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">
                                    Need Help?
                                </p>
                                <p style="color: #888888; font-size: 14px; margin: 0 0 20px 0;">
                                    Contact our support team at <a href="mailto:support@company.com" style="color: #1e88e5; text-decoration: none;">support@company.com</a>
                                </p>
                                <div style="margin: 20px 0;">
                                    <a href="#" style="display: inline-block; margin: 0 8px; color: #1e88e5; text-decoration: none; font-size: 20px;">📘</a>
                                    <a href="#" style="display: inline-block; margin: 0 8px; color: #1e88e5; text-decoration: none; font-size: 20px;">🐦</a>
                                    <a href="#" style="display: inline-block; margin: 0 8px; color: #1e88e5; text-decoration: none; font-size: 20px;">📸</a>
                                </div>
                                <p style="color: #aaaaaa; font-size: 12px; margin: 15px 0 0 0;">
                                    © 2026 Your Company. All rights reserved.<br>
                                    123 Business Street, City, Country
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth:{
            user: emailUser,
            pass: emailPass

        }
    })

    const mailOptions = {
        from: emailUser,
        to:email,
        subject:"Email Verification",
        html:messageTemplate
    }




    return transporter.sendMail(mailOptions)
    }

        
   

module.exports = sendemailVerification
