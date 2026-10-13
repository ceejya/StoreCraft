import { useState } from "react"
import { Eye, EyeSlash, WarningCircle, CheckCircle } from "./Icons"

/**
 * Labelled input with inline hint / error messaging.
 * Pass type="password" to get an accessible show/hide toggle.
 */
const AuthField = ({ id, label, type = "text", error, hint, hintMet = false, ...inputProps }) => {
    const [revealed, setRevealed] = useState(false)
    const isPassword = type === "password"
    const messageId = `${id}-message`
    const hasMessage = Boolean(error || hint)

    return (
        <div className={`auth-field${error ? " has-error" : ""}`}>
            <label htmlFor={id} className="auth-label">{label}</label>

            <div className="auth-input-wrap">
                <input
                    id={id}
                    type={isPassword && revealed ? "text" : type}
                    className={`auth-input${isPassword ? " has-toggle" : ""}`}
                    aria-invalid={Boolean(error)}
                    aria-describedby={hasMessage ? messageId : undefined}
                    {...inputProps}
                />

                {isPassword && (
                    <button
                        type="button"
                        className="auth-reveal"
                        onClick={() => setRevealed((v) => !v)}
                        aria-label={revealed ? "Hide password" : "Show password"}
                        aria-pressed={revealed}
                    >
                        {revealed ? <EyeSlash size={18} weight="regular" /> : <Eye size={18} weight="regular" />}
                    </button>
                )}
            </div>

            {error ? (
                <p id={messageId} className="auth-field-msg is-error">
                    <WarningCircle size={15} weight="fill" aria-hidden="true" />
                    {error}
                </p>
            ) : hint ? (
                <p id={messageId} className={`auth-field-msg${hintMet ? " is-met" : ""}`}>
                    {hintMet && <CheckCircle size={15} weight="fill" aria-hidden="true" />}
                    {hint}
                </p>
            ) : null}
        </div>
    )
}

export default AuthField
