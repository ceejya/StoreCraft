import { API_URL } from "../config"
import React, { useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom"
import { toast } from "react-toastify"
import axios from "axios"

const VerifyOtp = () => {
    const [otp, setOtp] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const email = location.state?.email

    const handleVerify = async () => {
        setIsLoading(true)
        try {
            const response = await axios.post(API_URL + "/user/verifyotp", { email, otp });
            toast.success(response.data.message)
            navigate("/login")
        } catch (error) {
            const errormessage = error?.response?.data?.message
            console.log(errormessage);
            toast.error(errormessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
            <div className="card border-0 shadow-sm" style={{ maxWidth: "420px", width: "100%", borderRadius: "1rem" }}>
                <div className="card-body p-4 p-sm-5">

                    <div className="mb-4">
                        <h2 className="fw-bold mb-1">Verify your email</h2>
                        <p className="text-muted mb-0">
                            Enter the 6-digit code sent to {email ? <strong>{email}</strong> : "your email"}
                        </p>
                    </div>

                    <div className="form-floating mb-4">
                        <input
                            id="otp"
                            type="text"
                            className="form-control"
                            placeholder="Enter code"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                        <label htmlFor="otp">6-digit code</label>
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={isLoading}
                        className="btn btn-primary w-100 py-2 fw-semibold"
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Verifying...
                            </>
                        ) : (
                            "Verify"
                        )}
                    </button>

                </div>
            </div>
        </div>
    )
}
export default VerifyOtp