import React, { useState } from 'react';
import { toast } from "react-toastify"
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios"
import { ArrowRight } from "./auth/Icons"
import AuthLayout from "./auth/AuthLayout"
import AuthField from "./auth/AuthField"
import AuthAlert from "./auth/AuthAlert"
import { getErrorMessage, EMAIL_PATTERN } from "./auth/authHelpers"

const Login = () => {
    const navigate = useNavigate()

    const [loginuser, setloginuser] = useState({
        email: "",
        password: ""
    })
    const [isLoading, setIsLoading] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})
    const [serverError, setServerError] = useState("")
    const [needsVerification, setNeedsVerification] = useState(false)

    const validate = () => {
        const errors = {}
        if (!loginuser.email.trim()) {
            errors.email = "Enter your email address"
        } else if (!EMAIL_PATTERN.test(loginuser.email.trim())) {
            errors.email = "That doesn't look like a valid email"
        }
        if (!loginuser.password) errors.password = "Enter your password"
        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        if (isLoading) return
        setServerError("")
        setNeedsVerification(false)
        if (!validate()) return

        setIsLoading(true)
        try {
            const response = await axios.post("http://localhost:8004/user/login", loginuser);
            localStorage.setItem("usertoken", response.data.token)
            toast.success(response.data.message)
            navigate("/Dashboard")
        } catch (error) {
            const message = getErrorMessage(error)
            setServerError(message)
            if (/not verified/i.test(message)) {
                sessionStorage.setItem("pendingVerificationEmail", loginuser.email.trim())
                setNeedsVerification(true)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (field) => (e) => {
        setloginuser({ ...loginuser, [field]: e.target.value })
        if (fieldErrors[field]) {
            setFieldErrors({ ...fieldErrors, [field]: undefined })
        }
    }

    return (
        <AuthLayout
            switchPrompt="New here?"
            switchLabel="Create an account"
            switchTo="/"
            caption={{
                headline: "Pick up where you left off.",
                sub: "Your listings and conversations are right where you left them."
            }}
        >
            <title>Log in</title>
            <meta name="description" content="Log in to manage your products and conversations." />

            <div className="auth-intro">
                <h1 className="auth-title">Log in</h1>
                <p className="auth-lede">Welcome back. Enter your details to continue.</p>
            </div>

            <AuthAlert message={serverError}>
                {needsVerification && (
                    <Link
                        to="/verify-otp"
                        state={{ email: loginuser.email.trim() }}
                        className="auth-link auth-alert-action"
                    >
                        Enter your verification code
                    </Link>
                )}
            </AuthAlert>

            <form className="auth-form" onSubmit={handleLogin} noValidate>
                <AuthField
                    id="login-email"
                    label="Email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={loginuser.email}
                    onChange={handleChange("email")}
                    error={fieldErrors.email}
                />

                <AuthField
                    id="login-password"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    value={loginuser.password}
                    onChange={handleChange("password")}
                    error={fieldErrors.password}
                />

                <button
                    id="login-submit"
                    type="submit"
                    className="auth-submit"
                    disabled={isLoading}
                    aria-busy={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="auth-spinner" aria-hidden="true" />
                            Logging in…
                        </>
                    ) : (
                        <>
                            Log in
                            <ArrowRight size={18} weight="bold" className="auth-submit-icon" aria-hidden="true" />
                        </>
                    )}
                </button>
            </form>
        </AuthLayout>
    )
}

export default Login
