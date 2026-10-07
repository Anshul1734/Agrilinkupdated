import { initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// These values are public by design (they identify the project, they don't grant access).
// Access is enforced by Firebase Auth + the backend verifying ID tokens.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isAuthConfigured = Object.values(config).every(Boolean);

// A missing .env must not blank the whole site: browsing works without sign-in.
export const auth: Auth | null = isAuthConfigured ? getAuth(initializeApp(config)) : null;
