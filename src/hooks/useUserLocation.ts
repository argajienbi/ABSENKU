import { useState, useEffect, useRef } from "react";
import { calculateDistance } from "../settingsObject";
import { performIntegrityCheck } from "../lib/integrity";
import { toast } from "sonner";

export function useUserLocation(settings: any, user: any) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [isFakeGPS, setIsFakeGPS] = useState(false);
  const [currentAreaName, setCurrentAreaName] = useState<string | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  useEffect(() => {
    if (!settings) return;

    if (!settings.geofenceEnabled) {
      setIsWithinRadius(true);
    }

    if (navigator.geolocation) {
      let watchId: number;
      let options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 };

      const startWatching = () => {
        return navigator.geolocation.watchPosition(
          (position) => {
            setLocationError(false);
            const { latitude, longitude, accuracy } = position.coords;
            const now = Date.now();

            // Perform integrity check here
            performIntegrityCheck(
              latitude,
              longitude,
              accuracy,
              now,
              lastPosRef.current
                ? { lat: lastPosRef.current.lat, lng: lastPosRef.current.lng, time: lastPosRef.current.time }
                : undefined
            ).then((result) => {
              if (result.isSuspicious) {
                setIsFakeGPS(true);
                if (!isFakeGPS) toast.error(`Aktivitas mencurigakan terdeteksi: ${result.reason}`);
              } else {
                setIsFakeGPS(false);
              }
            });

            if (lastPosRef.current) {
              const dist = calculateDistance(latitude, longitude, lastPosRef.current.lat, lastPosRef.current.lng);
              const timeDiff = (now - lastPosRef.current.time) / 1000; // seconds
              if (timeDiff > 0) {
                const speed = dist / timeDiff; // m/s
                if (speed > 100) {
                  setIsFakeGPS(true);
                  toast.error("Aktivitas mencurigakan terdeteksi (Fake GPS).");
                }
              }
            }
            lastPosRef.current = { lat: latitude, lng: longitude, time: now };

            setLocation({ lat: latitude, lng: longitude });

            let closestAreaDist = Infinity;
            let inAnyArea = false;
            let foundAreaName = "Di Luar Area Terdaftar";
            let closestTargetLat = 0;
            let closestTargetLng = 0;
            let closestTargetRadius = 100;

            if (settings.areas && Object.keys(settings.areas).length > 0) {
              if (user?.areaId && settings.areas[user.areaId]) {
                const areaConfig = settings.areas[user.areaId];
                closestTargetLat = areaConfig.lat;
                closestTargetLng = areaConfig.lng;
                closestTargetRadius = areaConfig.radius;
                const dist = calculateDistance(latitude, longitude, closestTargetLat, closestTargetLng);
                closestAreaDist = dist;
                if (dist <= closestTargetRadius) {
                  inAnyArea = true;
                  foundAreaName = areaConfig.name;
                }
              } else {
                Object.values(settings.areas).forEach((area: any) => {
                  const areaDist = calculateDistance(latitude, longitude, area.lat, area.lng);
                  if (areaDist < closestAreaDist) {
                    closestAreaDist = areaDist;
                    closestTargetLat = area.lat;
                    closestTargetLng = area.lng;
                    closestTargetRadius = area.radius;
                  }
                  if (areaDist <= area.radius) {
                    inAnyArea = true;
                    foundAreaName = area.name;
                  }
                });
              }
            } else {
              setCurrentAreaName("Belum Ada Area Terdaftar");
            }

            if (closestAreaDist !== Infinity) {
              setDistance(closestAreaDist);
              if (settings.geofenceEnabled) {
                setIsWithinRadius(inAnyArea);
              }
              setCurrentAreaName(foundAreaName);
            } else {
              setDistance(null);
              if (settings.geofenceEnabled) {
                setIsWithinRadius(false);
              }
            }
          },
          (err) => {
            let errorMessage = "Unknown error";
            switch (err.code) {
              case err.PERMISSION_DENIED:
                errorMessage = "Izin lokasi ditolak oleh pengguna.";
                break;
              case err.POSITION_UNAVAILABLE:
                errorMessage = "Informasi lokasi tidak tersedia.";
                break;
              case err.TIMEOUT:
                errorMessage = "Waktu permintaan lokasi habis.";
                break;
            }
            console.error(`Geolocation error (${err.code}): ${err.message}`, { code: err.code, message: err.message });
            setLocationError(true);
            if (settings.geofenceEnabled) {
              setIsWithinRadius(false);
            }

            // Auto fallback if high accuracy times out
            if (err.code === err.TIMEOUT && options.enableHighAccuracy) {
              console.log("Retrying location without high accuracy...");
              options.enableHighAccuracy = false;
              if (watchId) navigator.geolocation.clearWatch(watchId);
              watchId = startWatching();
            }
          },
          options
        );
      };

      watchId = startWatching();
      return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
      };
    } else {
      setLocationError(true);
      if (settings.geofenceEnabled) {
        setIsWithinRadius(false);
      }
    }
  }, [settings, user?.areaId]);

  return { location, distance, isWithinRadius, locationError, isFakeGPS, currentAreaName, setIsWithinRadius };
}
