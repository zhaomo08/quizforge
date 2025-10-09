import { createAuthClient } from "better-auth/react";
import { env } from './env';

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = createAuthClient({
  baseURL: env.VITE_BETTER_AUTH_URL || window.location.origin,
});