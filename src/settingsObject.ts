import { useState, useEffect, useMemo } from "react";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./lib/firebase";

export interface SystemSettings {
  geofenceEnabled: boolean;
  useGoogleMaps?: boolean;
  appName?: string;
  appLogoUrl?: string;
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

  const areasStr = JSON.stringify(areas);
  const companiesStr = JSON.stringify(companies);
  const branchesStr = JSON.stringify(branches);
  const subareasStr = JSON.stringify(subareas);
  const settingsStr = JSON.stringify(settings);

  useEffect(() => {
    const unsubAreas = onSnapshot(collection(db, 'areas'), (snap) => {
      const data: any = {};
      snap.forEach((doc) => { data[doc.id] = doc.data(); });
      if (JSON.stringify(data) !== areasStr) setAreas(data);
    });
    
    const unsubCompanies = onSnapshot(collection(db, 'companies'), (snap) => {
      const data: any = {};
      snap.forEach((doc) => { data[doc.id] = doc.data(); });
      if (JSON.stringify(data) !== companiesStr) setCompanies(data);
    });

    const unsubBranches = onSnapshot(collection(db, 'branches'), (snap) => {
      const data: any = {};
      snap.forEach((doc) => { data[doc.id] = doc.data(); });
      if (JSON.stringify(data) !== branchesStr) setBranches(data);
    });

    const unsubSubareas = onSnapshot(collection(db, 'subareas'), (snap) => {
      const data: any = {};
      snap.forEach((doc) => { data[doc.id] = doc.data(); });
      if (JSON.stringify(data) !== subareasStr) setSubareas(data);
    });

    return () => {
      unsubAreas(); unsubCompanies(); unsubBranches(); unsubSubareas();
    };
  }, [areasStr, companiesStr, branchesStr, subareasStr]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "global"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SystemSettings;
        const newSettings = {
          ...data,
          appName: data.appName || "ABSENKU",
          appLogoUrl: data.appLogoUrl || "",
          useGoogleMaps: data.useGoogleMaps ?? false,
          googleMapsApiKey: data.googleMapsApiKey || "",
          shifts: data.shifts || {},
          holidays: data.holidays || []
        };
        if (JSON.stringify(newSettings) !== settingsStr) setSettings(newSettings);
      } else {
         const defaultSettings = {
           geofenceEnabled: false,
           useGoogleMaps: false,
           appName: "ABSENKU",
           appLogoUrl: "",
           googleMapsApiKey: "",
           shifts: {},
           holidays: []
         };
         if (JSON.stringify(defaultSettings) !== settingsStr) setSettings(defaultSettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/global");
    });
    return () => unsub();
  }, [settingsStr]);

  const mergedSettings = useMemo(() => 
    settings ? { ...settings, areas, companies, branches, subareas } : null,
    [settings, areas, companies, branches, subareas]
  );

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
