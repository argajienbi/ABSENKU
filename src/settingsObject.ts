import { useState, useEffect } from "react";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./lib/firebase";

export interface SystemSettings {
  geofenceEnabled: boolean;
  appName?: string;
  appLogoUrl?: string;
  fcmVapidKey?: string;
  googleMapsApiKey?: string;
  shifts?: {
    [key: string]: {
      name: string;
      label: string;
      color: string;
      startTime?: string; // Default shift start
      endTime?: string;   // Default shift end
      gracePeriod?: number; // In minutes
      workDays: {
        [day: number]: { start: string; end: string } | null;
      };
    };
  };
  areas?: any;
  companies?: any;
  branches?: any;
  subareas?: any;
  holidays?: string[]; // Array of YYYY-MM-DD
}

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [areas, setAreas] = useState<any>({});
  const [companies, setCompanies] = useState<any>({});
  const [branches, setBranches] = useState<any>({});
  const [subareas, setSubareas] = useState<any>({});

  useEffect(() => {
    const unsubAreas = onSnapshot(
      collection(db, 'areas'),
      (snap) => {
        const data: any = {};
        snap.forEach((doc) => { data[doc.id] = doc.data(); });
        setAreas(data);
      },
      (error) => console.error("Areas onSnapshot error:", error)
    );
    
    const unsubCompanies = onSnapshot(
      collection(db, 'companies'),
      (snap) => {
        const data: any = {};
        snap.forEach((doc) => { data[doc.id] = doc.data(); });
        setCompanies(data);
      },
      (error) => console.error("Companies onSnapshot error:", error)
    );

    const unsubBranches = onSnapshot(
      collection(db, 'branches'),
      (snap) => {
        const data: any = {};
        snap.forEach((doc) => { data[doc.id] = doc.data(); });
        setBranches(data);
      },
      (error) => console.error("Branches onSnapshot error:", error)
    );

    const unsubSubareas = onSnapshot(
      collection(db, 'subareas'),
      (snap) => {
        const data: any = {};
        snap.forEach((doc) => { data[doc.id] = doc.data(); });
        setSubareas(data);
      },
      (error) => console.error("Subareas onSnapshot error:", error)
    );

    return () => {
      unsubAreas();
      unsubCompanies();
      unsubBranches();
      unsubSubareas();
    };
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "global"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SystemSettings;
          setSettings({
            ...data,
            appName: data.appName || "ABSENKU",
            appLogoUrl: data.appLogoUrl || "",
            fcmVapidKey: data.fcmVapidKey || "",
            googleMapsApiKey: data.googleMapsApiKey || "",
            shifts: data.shifts || {},
            holidays: data.holidays || []
          });
        } else {
           // Provide safe defaults if no settings are configured yet
           setSettings({
             geofenceEnabled: false,
             appName: "ABSENKU",
             appLogoUrl: "",
             fcmVapidKey: "",
             googleMapsApiKey: "",
             shifts: {},
             holidays: []
           });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "settings/global");
      }
    );
    return () => unsub();
  }, []);

  const mergedSettings = settings ? { ...settings, areas, companies, branches, subareas } : null;

  useEffect(() => {
    let manifestURL: string | null = null;
    
    if (mergedSettings?.appName) {
      document.title = mergedSettings.appName;
      
      // Update metadata tags
      const metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (metaTitle) metaTitle.setAttribute('content', mergedSettings.appName);
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) metaDescription.setAttribute('content', `Aplikasi Absensi ${mergedSettings.appName}`);
      
      // Update or create dynamic manifest for PWA
      const manifest = {
        "name": mergedSettings.appName,
        "short_name": mergedSettings.appName.substring(0, 12),
        "description": `Aplikasi ${mergedSettings.appName}`,
        "start_url": window.location.origin,
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#0d9488",
        "icons": [
          {
            "src": "https://cdn-icons-png.flaticon.com/512/3204/3204361.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "https://cdn-icons-png.flaticon.com/512/3204/3204361.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
          }
        ]
      };
      
      try {
        const stringManifest = JSON.stringify(manifest);
        const blob = new Blob([stringManifest], {type: 'application/json'});
        manifestURL = URL.createObjectURL(blob);
        
        let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (link) {
          link.href = manifestURL;
        } else {
          link = document.createElement('link');
          link.rel = 'manifest';
          link.href = manifestURL;
          document.head.appendChild(link);
        }
      } catch (err) {
        console.error("Error updating manifest:", err);
      }
    }

    return () => {
      if (manifestURL) {
        URL.revokeObjectURL(manifestURL);
      }
    };
  }, [mergedSettings?.appName]);

  return mergedSettings;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return d;
}
