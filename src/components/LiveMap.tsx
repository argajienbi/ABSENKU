import React, { useMemo, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { format, isToday } from "date-fns";

interface LiveMapProps {
  attendances: any[];
  users: any[];
  apiKey: string;
  center: { lat: number; lng: number };
}

export function LiveMap({ attendances, users, apiKey, center }: LiveMapProps) {
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

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

  return (
    <div className="w-full h-full relative">
      <APIProvider apiKey={apiKey || ""}>
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={safeCenter}
          defaultZoom={14}
          mapId="DEMO_MAP_ID"
          disableDefaultUI={false}
          zoomControl={true}
        >
          <AdvancedMarker 
            position={safeCenter}
            onClick={() => setActiveMarker('center')}
          >
            <Pin background={"#6366f1"} borderColor={"#ffffff"} glyphColor={"#ffffff"} />
          </AdvancedMarker>

          {activeMarker === 'center' && (
            <InfoWindow position={safeCenter} onCloseClick={() => setActiveMarker(null)}>
                 <div className="p-1">
                     <h3 className="font-bold text-gray-800 text-sm">Pusat Area</h3>
                 </div>
            </InfoWindow>
          )}

          {mapData.map(log => {
            if (!log.location || isNaN(parseFloat(log.location.latitude as any)) || isNaN(parseFloat(log.location.longitude as any))) return null;
            const position = { lat: parseFloat(log.location.latitude as any), lng: parseFloat(log.location.longitude as any) };
            const isHovered = activeMarker === log.id;
            
            let color = "#10b981"; // green for 'in'
            if (log.type === 'out') color = "#f43f5e"; // red
            if (log.type === 'sick') color = "#f59e0b"; // yellow
            if (log.type === 'permit') color = "#3b82f6"; // blue
            if (log.isEarlyLeave || log.isLate) color = "#f97316"; // orange

            return (
              <React.Fragment key={log.id}>
                <AdvancedMarker
                  position={position}
                  onClick={() => setActiveMarker(log.id)}
                  zIndex={isHovered ? 100 : 1}
                >
                  <div style={{ transform: isHovered ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.2s' }}>
                    <Pin background={color} borderColor={"#ffffff"} glyphColor={"#ffffff"} />
                  </div>
                </AdvancedMarker>
                {isHovered && (
                  <InfoWindow position={position} onCloseClick={() => setActiveMarker(null)}>
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
              </React.Fragment>
            );
          })}
        </Map>
      </APIProvider>
    </div>
  );
}
