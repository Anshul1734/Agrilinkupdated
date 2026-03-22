// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { User as FirebaseUser, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { UserType } from "@/types";

interface User {
  id: number;
  name: string;
  email: string;
  contactNumber?: string;
  address?: string;
  userType: UserType;
  registrationDate: string;
  terrain?: string;
  recommendedCrops?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  userType: UserType | null;
  login: (userData: User) => void;
  logout: () => void;
  firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // Your app user
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null); // Firebase user
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userType, setUserType] = useState<UserType | null>(null);

  // 🔐 Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        
        // Hydrate from Firestore to survive page refreshes!
        try {
          const userDoc = await getDoc(doc(db, "users", fbUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
            setUserType(userData.userType);
          }
        } catch(e) {
          console.error("Hydration failed", e);
        }

        setIsAuthenticated(true);
      } else {
        setFirebaseUser(null);
        setIsAuthenticated(false);
        setUser(null);
        setUserType(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ Manual login with full app-specific user object
  const login = (userData: User) => {
    setUser(userData);
    setUserType(userData.userType);
    setIsAuthenticated(true);
  };

  // 🔓 Firebase logout and clear context
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAuthenticated(false);
    setUserType(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        userType,
        login,
        logout,
        firebaseUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
