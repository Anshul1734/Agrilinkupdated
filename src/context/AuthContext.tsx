import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { auth, isAuthConfigured } from "@/lib/firebase";
import { api, ApiError } from "@/lib/api";
import type { Profile, UserType } from "@/types";
import { MOCK_ENABLED } from "@/mocks/api";
import { getMockProfile, setMockRole } from "@/mocks/session";

/**
 * loading      - waiting for Firebase to tell us who (if anyone) is signed in
 * signedOut    - nobody
 * needsProfile - signed in with Firebase but no Agrilink profile yet (role etc. not chosen)
 * ready        - signed in with a profile
 * error        - signed in, but the profile could not be loaded (server down, etc.)
 */
export type AuthStatus = "loading" | "signedOut" | "needsProfile" | "ready" | "error";

export interface ProfileInput {
  name: string;
  role: UserType;
  contactNumber?: string;
  address?: string;
  terrain?: string;
}

interface AuthContextType {
  status: AuthStatus;
  firebaseUser: FirebaseUser | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  userType: UserType | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile: ProfileInput) => Promise<void>;
  createProfile: (input: ProfileInput) => Promise<void>;
  updateProfile: (input: Partial<Omit<ProfileInput, "role">>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Demo mode only (VITE_MOCK=true): sign in as the built-in buyer or farmer, no password. */
  demoSignIn: (role: UserType) => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NOT_CONFIGURED = "Sign-in isn't configured on this deployment yet.";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>(MOCK_ENABLED ? (getMockProfile() ? "ready" : "signedOut") : isAuthConfigured ? "loading" : "signedOut");
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(MOCK_ENABLED ? getMockProfile() : null);
  // While signUp() is creating the account + profile, the auth listener must not race it.
  const signingUp = useRef(false);
  const queryClient = useQueryClient();
  // undefined until Firebase reports once; afterwards the uid we last saw (null = signed out).
  const lastUid = useRef<string | null | undefined>(undefined);

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await api.get<Profile>("/profile"));
      setStatus("ready");
    } catch (err) {
      if (err instanceof ApiError && err.code === "profile_required") {
        setProfile(null);
        setStatus("needsProfile");
      } else {
        console.error("Could not load profile", err);
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    if (!auth || MOCK_ENABLED) return;
    return onAuthStateChanged(auth, (user) => {
      // Cached server data (orders, listings, notifications…) belongs to ONE person. When the identity changes,
      // drop all of it so the next person on this browser can never see the previous person's data.
      const uid = user?.uid ?? null;
      if (lastUid.current !== undefined && lastUid.current !== uid) {
        void queryClient.cancelQueries();
        queryClient.clear();
      }
      lastUid.current = uid;
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setStatus("signedOut");
      } else if (!signingUp.current) {
        setStatus("loading");
        void loadProfile();
      }
    });
  }, [loadProfile, queryClient]);

  const demoSignIn = useCallback(
    (role: UserType) => {
      void queryClient.cancelQueries();
      queryClient.clear();
      setMockRole(role);
      setProfile(getMockProfile());
      setStatus("ready");
    },
    [queryClient],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    if (MOCK_ENABLED) return demoSignIn(email.toLowerCase().includes("farm") ? "Farmer" : "Buyer");
    if (!auth) throw new Error(NOT_CONFIGURED);
    await signInWithEmailAndPassword(auth, email, password);
  }, [demoSignIn]);

  const createProfile = useCallback(async (input: ProfileInput) => {
    setProfile(await api.post<Profile>("/profile", input));
    setStatus("ready");
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, input: ProfileInput) => {
      if (MOCK_ENABLED) return demoSignIn(input.role);
      if (!auth) throw new Error(NOT_CONFIGURED);
      signingUp.current = true;
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        await createProfile(input);
      } catch (err) {
        // If the Firebase account exists but the profile call failed, let the user finish onboarding.
        if (auth.currentUser) await loadProfile();
        throw err;
      } finally {
        signingUp.current = false;
      }
    },
    [createProfile, loadProfile, demoSignIn],
  );

  const updateProfile = useCallback(async (input: Partial<Omit<ProfileInput, "role">>) => {
    setProfile(await api.patch<Profile>("/profile", input));
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!auth) throw new Error(NOT_CONFIGURED);
    await sendPasswordResetEmail(auth, email);
  }, []);

  const signOut = useCallback(async () => {
    if (MOCK_ENABLED) {
      void queryClient.cancelQueries();
      queryClient.clear();
      setMockRole(null);
      setProfile(null);
      setStatus("signedOut");
      return;
    }
    if (auth) await fbSignOut(auth);
  }, [queryClient]);

  const retry = useCallback(() => {
    setStatus("loading");
    void loadProfile();
  }, [loadProfile]);

  const value = useMemo<AuthContextType>(
    () => ({
      status,
      firebaseUser,
      profile,
      isAuthenticated: status === "ready",
      userType: profile?.role ?? null,
      signIn,
      signUp,
      createProfile,
      updateProfile,
      resetPassword,
      signOut,
      demoSignIn,
      retry,
    }),
    [status, firebaseUser, profile, signIn, signUp, createProfile, updateProfile, resetPassword, signOut, demoSignIn, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
