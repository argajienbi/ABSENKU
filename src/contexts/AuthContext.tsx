import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, addDoc, collection } from "firebase/firestore";
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
  monthlyShifts?: Record<string, string>;
  uniqueId: string;
  areaId?: string | null;
  companyId?: string | null;
  branchId?: string | null;
  isBanned?: boolean;
  createdAt?: number;
  deviceId?: string;
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
    
    // Ensure this device has a persistent local device ID
    let currentDeviceId = localStorage.getItem("app_device_id");
    if (!currentDeviceId) {
      currentDeviceId = Math.random().toString(36).substring(2, 18);
      localStorage.setItem("app_device_id", currentDeviceId);
    }

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
            const userData = userSnap.data() as AppUser;
            
            // Check for device lock
            if (userData.deviceId && userData.deviceId !== currentDeviceId && !localStorage.getItem("suppress_device_logout")) {
               console.log("Device mismatch detected. Found ID:", userData.deviceId, "Current:", currentDeviceId);
               alert("Anda telah masuk (login) dari perangkat lain. Anda akan dikeluarkan dari perangkat ini.");
               auth.signOut();
               setUser(null);
               return;
            }

            // Optional: If somehow they have no deviceId, we could stamp it.
            // But we actually do it upon explicit login to prevent weird background updates.
            setUser({ uid: fbUser.uid, ...userData });
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
