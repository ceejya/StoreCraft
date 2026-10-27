// Vercel can override this with VITE_API_URL; local development uses the local backend.
const defaultApiUrl = import.meta.env.DEV
? "http://localhost:8004"
    : "https://storecraft-2.onrender.com"

export const API_URL = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/$/, "")
