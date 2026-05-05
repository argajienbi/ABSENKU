import React, { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { format, isToday } from "date-fns";
import { id } from "date-fns/locale";

interface LiveMapProps {
  attendances: any[];
  users: any[];
  apiKey: string;
  center: { lat: number; lng: number };
}

const LIBRARIES: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

export function LiveMap({ attendances, users, apiKey, center }: LiveMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES
  });

  const [activeMarker, setActiveMarker] = React.useState<string | null>(null);

  // Filter only today's attendances
  const todayAttendances = useMemo(() => {
    return attendances.filter(log => isToday(new Date(log.timestamp)));
  }, [attendances]);

  const mapData = useMemo(() => {
    return todayAttendances.map(att => {
      const u = users.find(user => user.uid === att.userId);
      return {
        ...att,
        userName: u?.name || 'Unknown User',
        userRole: u?.role || 'Karyawan',
      };
    });
  }, [todayAttendances, users]);

  const safeCenter = {
    lat: isNaN(parseFloat(center.lat as any)) ? -6.2088 : parseFloat(center.lat as any),
    lng: isNaN(parseFloat(center.lng as any)) ? 106.8456 : parseFloat(center.lng as any)
  };

  if (!isLoaded) return <div className="w-full h-full flex items-center justify-center animate-pulse bg-gray-100 dark:bg-gray-800"><span className="text-gray-400 font-bold">Memuat Peta...</span></div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={safeCenter}
      zoom={14}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
      }}
    >
      <Marker 
        position={safeCenter} 
        icon={{
          url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'%3E%3C/path%3E%3Cpolyline points='9 22 9 12 15 12 15 22'%3E%3C/polyline%3E%3C/svg%3E",
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        }} 
      >
        <InfoWindow position={safeCenter}>
             <div className="p-1">
                 <h3 className="font-bold text-gray-800 text-sm">Kantor Pusat</h3>
             </div>
        </InfoWindow>
      </Marker>

      {mapData.map(log => {
        if (!log.location || isNaN(parseFloat(log.location.latitude as any)) || isNaN(parseFloat(log.location.longitude as any))) return null;
        const position = { lat: parseFloat(log.location.latitude as any), lng: parseFloat(log.location.longitude as any) };
        const isHovered = activeMarker === log.id;
        
        let color = "%2310b981"; // green for 'in'
        if (log.type === 'out') color = "%23f43f5e"; // red
        if (log.type === 'sick') color = "%23f59e0b"; // yellow
        if (log.type === 'permit') color = "%233b82f6"; // blue
        if (log.isEarlyLeave || log.isLate) color = "%23f97316"; // orange

        return (
          <Marker
            key={log.id}
            position={position}
            onClick={() => setActiveMarker(log.id)}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${color}' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'%3E%3C/path%3E%3Ccircle cx='12' cy='10' r='3'%3E%3C/circle%3E%3C/svg%3E`,
              scaledSize: new window.google.maps.Size(isHovered ? 45 : 35, isHovered ? 45 : 35),
            }}
          >
            {isHovered && (
              <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                <div className="p-3 bg-white rounded-lg min-w-[200px] shadow-sm">
                  <div className="flex gap-2 items-center mb-2">
                    <div className="w-8 h-8 rounded-full shadow-sm overflow-hidden bg-gray-100 shrink-0">
                      {log.photoUrl ? (
                         <img src={log.photoUrl} alt="face" className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex justify-center items-center font-black text-gray-400 text-xs">{log.userName.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{log.userName}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{log.type.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-slate-600"><span className="font-medium">Waktu:</span> {format(new Date(log.timestamp), 'HH:mm:ss')}</p>
                    {log.location?.address && <p className="text-xs text-slate-600 line-clamp-2" title={log.location.address}>{log.location.address}</p>}
                    {log.isFakeGPS && <span className="inline-block mt-1 bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200">FAKE GPS DETECTED</span>}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Marker>
        );
      })}
    </GoogleMap>
  );
}
