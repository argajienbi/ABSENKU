// src/lib/integrity.ts

export interface IntegrityCheckResult {
  isSuspicious: boolean;
  reason: string | null;
}

/**
 * Perform basic client-side integrity checks for attendance.
 * Note: Browser-based spoofing detection is limited.
 */
export async function performIntegrityCheck(
  currentLat: number,
  currentLng: number,
  accuracy: number,
  timestamp: number,
  previousPos?: { lat: number, lng: number, time: number }
): Promise<IntegrityCheckResult> {
  // 1. Accuracy check: Very high accuracy reported might be suspicious (or just good GPS)
  // But often, fake GPS apps report a static "5.0" or "0.0" accuracy.
  if (accuracy < 1) {
    return { isSuspicious: true, reason: "Akurasi lokasi tidak wajar/terlalu presisi (potensi Fake GPS)." };
  }

  // 2. Speed/Jump check: Teleportation
  if (previousPos) {
    const timeDeltaMs = timestamp - previousPos.time;
    const distanceMeters = calculateDistance(
      currentLat, currentLng,
      previousPos.lat, previousPos.lng
    );
    
    // If movement is > 1km in less than a few seconds, it's highly suspicious
    if (timeDeltaMs > 0) {
      const speedKmh = (distanceMeters / 1000) / ((timeDeltaMs / 1000) / 3600);
      
      if (speedKmh > 300) { // Extremely fast movement
        return { isSuspicious: true, reason: "Terdeteksi pergerakan tidak wajar (teleportasi)." };
      }
    }
  }

  return { isSuspicious: false, reason: null };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Return in meters
}
