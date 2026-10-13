import React, { useState } from 'react';
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import axios from "axios"
import { ArrowRight } from "./auth/Icons"
import AuthLayout from "./auth/AuthLayout"
import AuthField from "./auth/AuthField"
import AuthAlert from "./auth/AuthAlert"
import { getErrorMessage, EMAIL_PATTERN } from "./auth/authHelpers"

const MIN_PASSWORD = 6

const SignupForm = () => {
    const [userdetail, setuserdetail] = useState({
        username: "",
        email: "",
        password: ""
    })
    const [isLoading, setIsLoading] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})
    const [serverError, setServerError] = useState("")
    const navigate = useNavigate()

    const validate = () => {
        const errors = {}
        if (!userdetail.username.trim()) errors.username = "Choose a username"
        if (!userdetail.email.trim()) {
            errors.email = "Enter your email address"
        } else if (!EMAIL_PATTERN.test(userdetail.email.trim())) {
            errors.email = "That doesn't look like a valid email"
        }
        if (!userdetail.password) {
            errors.password = "Create a password"
        } else if (userdetail.password.length < MIN_PASSWORD) {
            errors.password = `Use at least ${MIN_PASSWORD} characters`
        }
        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSignup = async (e) => {
        e.preventDefault()
        if (isLoading) return
        setServerError("")
        if (!validate()) return

        setIsLoading(true)
        try {
            const response = await axios.post("http://localhost:8004/user/Signup", userdetail);
            toast.success(response.data.message)
            const email = userdetail.email.trim()
            sessionStorage.setItem("pendingVerificationEmail", email)
            navigate("/verify-otp", { state: { email } })
        } catch (error) {
            setServerError(getErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (field) => (e) => {
        setuserdetail({ ...userdetail, [field]: e.target.value })
        if (fieldErrors[field]) {
            setFieldErrors({ ...fieldErrors, [field]: undefined })
        }
    }

    return (
        <AuthLayout
            switchPrompt="Already have an account?"
            switchLabel="Log in"
            switchTo="/login"
            caption={{
                headline: "Sell what you make. Talk to buyers live.",
                sub: "List products with photos and prices, then chat with buyers in real time."
            }}
        >
            <title>Create your account</title>
            <meta name="description" content="Create an account to list products and message buyers in real time." />

            <div className="auth-intro">
                <p className="auth-step">Step 1 of 2</p>
                <h1 className="auth-title">Create your account</h1>
                <p className="auth-lede">
                    It takes a minute. We'll email you a 6-digit code to confirm your address.
                </p>
            </div>

            <AuthAlert message={serverError} />

            <form className="auth-form" onSubmit={handleSignup} noValidate>
                <AuthField
                    id="signup-username"
                    label="Username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={userdetail.username}
                    onChange={handleChange("username")}
                    error={fieldErrors.username}
                />

                <AuthField
                    id="signup-email"
                    label="Email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={userdetail.email}
                    onChange={handleChange("email")}
                    error={fieldErrors.email}
                />

                <AuthField
                    id="signup-password"
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    value={userdetail.password}
                    onChange={handleChange("password")}
                    error={fieldErrors.password}
                    hint={`At least ${MIN_PASSWORD} characters`}
                    hintMet={userdetail.password.length >= MIN_PASSWORD}
                />

                <button
                    id="signup-submit"
                    type="submit"
                    className="auth-submit"
                    disabled={isLoading}
                    aria-busy={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="auth-spinner" aria-hidden="true" />
                            Creating account…
                        </>
                    ) : (
                        <>
                            Create account
                            <ArrowRight size={18} weight="bold" className="auth-submit-icon" aria-hidden="true" />
                        </>
                    )}
                </button>
            </form>
        </AuthLayout>
    )
}

export default SignupForm
