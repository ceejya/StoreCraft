import { API_URL } from "../config"
import React, { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import axios from "axios"
import AuthLayout from "./auth/AuthLayout"
import AuthField from "./auth/AuthField"
import AuthAlert from "./auth/AuthAlert"
import { getErrorMessage } from "./auth/authHelpers"

const VerifyOtp = () => {
    const [otp, setOtp] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [fieldError, setFieldError] = useState("")
    const [serverError, setServerError] = useState("")
    const navigate = useNavigate()
    const location = useLocation()
    const email = location.state?.email || sessionStorage.getItem("pendingVerificationEmail") || ""

    const handleVerify = async (event) => {
        event.preventDefault()
        if (isLoading) return

        setServerError("")
        if (!/^\d{6}$/.test(otp)) {
            setFieldError("Enter the 6-digit code from your email")
            return
        }

        setFieldError("")
        setIsLoading(true)
        try {
            const response = await axios.post(`${API_URL}/user/verifyotp`, { email, otp })
            sessionStorage.removeItem("pendingVerificationEmail")
            toast.success(response.data.message)
            navigate("/login")
        } catch (error) {
            setServerError(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    const handleOtpChange = (event) => {
        setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
        if (fieldError) setFieldError("")
    }

    return (
        <AuthLayout
            switchPrompt="Already verified?"
            switchLabel="Log in"
            switchTo="/login"
            caption={{
                headline: "One last step.",
                sub: "Confirm your email address and you’re ready to set up your shop."
            }}
        >
            <title>Verify your email | StoreCraft</title>
            <meta name="description" content="Enter the verification code sent to your email to finish creating your StoreCraft account." />

            <div className="auth-intro">
                <p className="auth-step">Step 2 of 2</p>
                <h1 className="auth-title">Verify your email</h1>
                <p className="auth-lede">
                    Enter the 6-digit code we sent to{" "}
                    {email ? <strong>{email}</strong> : "your email address"}.
                </p>
            </div>

            <AuthAlert message={serverError} />

            <form className="auth-form" onSubmit={handleVerify} noValidate aria-busy={isLoading}>
                <div className="auth-otp-field">
                    <AuthField
                        id="verify-otp"
                        label="6-digit verification code"
                        value={otp}
                        onChange={handleOtpChange}
                        error={fieldError}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        placeholder="000000"
                        disabled={isLoading}
                    />
                </div>

                <button
                    type="submit"
                    className="auth-submit"
                    disabled={isLoading}
                    aria-busy={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="auth-spinner" aria-hidden="true" />
                            Verifying code…
                        </>
                    ) : (
                        "Verify email"
                    )}
                </button>
            </form>

            <p className="auth-otp-note">
                The code expires after 15 minutes.{" "}
                <Link to="/signup" className="auth-link">Use a different email</Link>
            </p>
        </AuthLayout>
    )
}

export default VerifyOtp
