/**
 * Turn an axios error into a sentence a person can act on.
 * The backend replies with { message }, but if the server is down there's no response at all.
 */
export const getErrorMessage = (error) => {
    if (!error?.response) {
        return "We couldn't reach the server. Check your connection and try again."
    }

    const message = error.response.data?.message
    if (!message) return "Something went wrong. Please try again."

    return message.charAt(0).toUpperCase() + message.slice(1)
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
