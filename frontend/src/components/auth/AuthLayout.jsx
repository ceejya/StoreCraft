import { Link } from "react-router-dom"
import AuthVisual from "./AuthVisual"

/**
 * Split-screen shell shared by Signup and Login.
 * Left: the form column. Right: an editorial still-life artwork with caption.
 */
const AuthLayout = ({ switchPrompt, switchLabel, switchTo, caption, children }) => {
    return (
        <main className="auth-page">
            <section className="auth-panel">
                <header className="auth-topbar">
                    <p className="auth-switch">
                        {switchPrompt}{" "}
                        <Link to={switchTo} className="auth-link">{switchLabel}</Link>
                    </p>
                </header>

                <div className="auth-panel-body">{children}</div>
            </section>

            <AuthVisual headline={caption.headline} sub={caption.sub} />
        </main>
    )
}

export default AuthLayout
