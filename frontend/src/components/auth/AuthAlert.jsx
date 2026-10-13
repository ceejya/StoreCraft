import { WarningCircle } from "./Icons"

/** Inline, screen-reader-announced form error with an optional follow-up action. */
const AuthAlert = ({ message, children }) => {
    if (!message) return null

    return (
        <div className="auth-alert" role="alert">
            <WarningCircle size={18} weight="fill" className="auth-alert-icon" aria-hidden="true" />
            <div className="auth-alert-body">
                <p className="auth-alert-text">{message}</p>
                {children}
            </div>
        </div>
    )
}

export default AuthAlert
