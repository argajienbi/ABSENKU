import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { auth, handleDatabaseError, OperationType } from "../lib/firebase";
import { listenObject } from "../lib/rtdbService";
import { toast } from "sonner";

interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: "superadmin" | "admin" | "staff" | "crew" | "demo" | "demouser";
  appRole: "superadmin" | "admin" | "user" | "demo";
  jobRole: "admin_pt" | "admin_area" | "admin_cabang" | "lead" | "staff" | "crew";
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
  subareaId?: string | null;
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

    let currentDeviceId = localStorage.getItem("app_device_id");
    if (!currentDeviceId) {
      currentDeviceId = Math.random().toString(36).substring(2, 18);
      localStorage.setItem("app_device_id", currentDeviceId);
    }

    const unsubscribeAuth = auth.onAuthStateChanged((fbUser) => {
      setFirebaseUser(fbUser);

      if (unsubscribeSnap) {
        unsubscribeSnap();
        unsubscribeSnap = null;
      }

      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      unsubscribeSnap = listenObject<AppUser>(
        `users/${fbUser.uid}`,
        (userData) => {
          if (userData) {
            if (userData.deviceId && userData.deviceId !== currentDeviceId && !localStorage.getItem("suppress_device_logout")) {
              console.log("Device mismatch detected. Found ID:", userData.deviceId, "Current:", currentDeviceId);
              toast.error("Sesi Berakhir", {
                description: "Anda telah masuk (login) dari perangkat lain. Anda akan dikeluarkan dari perangkat ini.",
                duration: 5000,
              });
              auth.signOut();
              setUser(null);
              setLoading(false);
              return;
            }

            setUser({ uid: fbUser.uid, ...userData });
            setLoading(false);
          } else {
            setUser(null);
            setLoading(false);
          }
        },
        (error) => {
          handleDatabaseError(error, OperationType.GET, `users/${fbUser.uid}`);
          setLoading(false);
        },
      );
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
