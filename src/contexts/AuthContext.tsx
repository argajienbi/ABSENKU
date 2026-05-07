import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";

interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: "superadmin" | "admin" | "staff" | "crew" | "demo" | "demouser";
  avatarUrl?: string;
  shiftId?: string;
  waNumber?: string;
  workStartDate?: number;
  workEndDate?: number;
  uniqueId: string;
  areaId?: string | null;
  isBanned?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnap: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (unsubscribeSnap) {
        unsubscribeSnap();
        unsubscribeSnap = null;
      }

      if (fbUser) {
        const userRef = doc(db, "users", fbUser.uid);
        
        unsubscribeSnap = onSnapshot(userRef, async (userSnap) => {
          if (userSnap.exists()) {
            setUser({ uid: fbUser.uid, ...userSnap.data() } as AppUser);
            setLoading(false);
          } else {
            // The document will be created by the registration flow in Login.tsx
            // Until then, keep user as null.
            setUser(null);
            setLoading(false);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, "users");
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnap) unsubscribeSnap();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, refreshUser: async () => {} }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
