import { useState, useEffect, useMemo } from "react";
import { handleDatabaseError, OperationType } from "./lib/firebase";
import { listenList, listenObject } from "./lib/rtdbService";

export interface SystemSettings {
  geofenceEnabled: boolean;
  useGoogleMaps?: boolean;
  appName?: string;
  appLogoUrl?: string;
  googleMapsApiKey?: string;
  shifts?: any;
  areas?: any;
  companies?: any;
  branches?: any;
  subareas?: any;
  holidays?: string[];
}

function rowsToRecord(rows: any[]) {
  const data: any = {};
  rows.forEach((row) => {
    data[row.id] = row;
  });
  return data;
}

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [areas, setAreas] = useState<any>({});
  const [companies, setCompanies] = useState<any>({});
  const [branches, setBranches] = useState<any>({});
  const [subareas, setSubareas] = useState<any>({});

  useEffect(() => {
    const unsubAreas = listenList("areas", (rows) => setAreas(rowsToRecord(rows)), (error) => handleDatabaseError(error, OperationType.LIST, "areas"));
    const unsubCompanies = listenList("companies", (rows) => setCompanies(rowsToRecord(rows)), (error) => handleDatabaseError(error, OperationType.LIST, "companies"));
    const unsubBranches = listenList("branches", (rows) => setBranches(rowsToRecord(rows)), (error) => handleDatabaseError(error, OperationType.LIST, "branches"));
    const unsubSubareas = listenList("subareas", (rows) => setSubareas(rowsToRecord(rows)), (error) => handleDatabaseError(error, OperationType.LIST, "subareas"));

    return () => {
      unsubAreas();
      unsubCompanies();
      unsubBranches();
      unsubSubareas();
    };
  }, []);

  useEffect(() => {
    const unsub = listenObject<SystemSettings>("settings/global", (data) => {
      const nextSettings = data || {
        geofenceEnabled: false,
        useGoogleMaps: false,
        appName: "ABSENKU",
        appLogoUrl: "",
        googleMapsApiKey: "",
        shifts: {},
        holidays: [],
      };

      setSettings({
        ...nextSettings,
        appName: nextSettings.appName || "ABSENKU",
        appLogoUrl: nextSettings.appLogoUrl || "",
        useGoogleMaps: nextSettings.useGoogleMaps ?? false,
        googleMapsApiKey: nextSettings.googleMapsApiKey || "",
        shifts: nextSettings.shifts || {},
        holidays: nextSettings.holidays || [],
      });
    }, (error) => handleDatabaseError(error, OperationType.GET, "settings/global"));

    return () => unsub();
  }, []);

  const mergedSettings = useMemo(() => settings ? { ...settings, areas, companies, branches, subareas } : null, [settings, areas, companies, branches, subareas]);

  useEffect(() => {
    if (mergedSettings?.appName) {
      document.title = mergedSettings.appName;
    }
  }, [mergedSettings?.appName]);

  return mergedSettings;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadius = 6371e3;
  const latRad1 = (lat1 * Math.PI) / 180;
  const latRad2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(latRad1) * Math.cos(latRad2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}
