import { createAuthClient } from 'better-auth/react'

// Same-origin /api/auth — the Vite dev proxy (and, in production, the
// reverse proxy) forwards it to the Express backend, so cookies stay
// first-party with zero CORS configuration.
export const authClient = createAuthClient()

export const { useSession } = authClient
