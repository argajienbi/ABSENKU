import React, { useMemo, useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { format, isToday } from "date-fns";
import { Users, Clock, AlertTriangle, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LiveMapProps {
  attendances: any[];
  users: any[];
  apiKey: string;
  center: { lat: number; lng: number };
  useGoogleMaps?: boolean;
}

function MapBoundsUpdater({ mapData, safeCenter }: { mapData: any[], safeCenter: {lat:number, lng:number} }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (mapData.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(new window.google.maps.LatLng(safeCenter.lat, safeCenter.lng));
      mapData.forEach(log => {
        if (log.location && !isNaN(log.location.lat) && !isNaN(log.location.lng)) {
          bounds.extend(new window.google.maps.LatLng(log.location.lat, log.location.lng));
        }
      });
      map.fitBounds(bounds);
      
      const listener = window.google.maps.event.addListener(map, "idle", () => { 
          if (map.getZoom() && (map.getZoom() as number) > 16) map.setZoom(16); 
          window.google.maps.event.removeListener(listener); 
      });
    } else {
      map.setCenter(safeCenter);
      map.setZoom(14);
    }
  }, [map, mapData, safeCenter]);
  return null;
}

function PureLeafletMap({ mapData, center }: { mapData: any[], center: [number, number] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(center, 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
      markersRef.current = L.layerGroup().addTo(mapRef.current);
    }

    const map = mapRef.current;
    
    // Fix issue where map tiles don't load due to container resize
    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    const markers = markersRef.current!;

    markers.clearLayers();

    // Center marker
    L.marker(center).addTo(markers).bindPopup("Pusat Area Kantor");

    const bounds = L.latLngBounds([center]);

    mapData.forEach(log => {
      if (!log.location || isNaN(parseFloat(log.location.lat as any)) || isNaN(parseFloat(log.location.lng as any))) return;
      const pos: [number, number] = [parseFloat(log.location.lat as any), parseFloat(log.location.lng as any)];
      
      const popupContent = `
        <div style="min-width: 150px">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; overflow: hidden; background: #eee; background-size: cover; background-image: url(${log.photoUrl || ''}); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 8px;">
              ${!log.photoUrl ? log.userName.charAt(0) : ''}
            </div>
            <p style="font-weight: bold; font-size: 12px; margin: 0;">${log.userName}</p>
          </div>
          <p style="font-size: 10px; margin: 0; color: #666; text-transform: uppercase;">${log.type} @ ${format(new Date(log.timestamp), 'HH:mm')}</p>
          ${log.isFakeGPS ? '<p style="font-size: 10px; margin: 0; color: #f00; font-weight: bold;">FAKE GPS DETECTED</p>' : ''}
        </div>
      `;

      L.marker(pos).addTo(markers).bindPopup(popupContent);
      bounds.extend(pos);
    });

    if (mapData.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else {
      map.setView(center, 14);
    }

    return () => {
      // Cleanup if needed
    };
  }, [mapData, center]);

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />;
}

export function LiveMap({ attendances, users, apiKey, center, useGoogleMaps = false }: LiveMapProps) {
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

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

  const leafletCenter: [number, number] = [safeCenter.lat, safeCenter.lng];

  return (
    <div className="absolute inset-0 w-full h-full flex">
      {/* Map Area */}
      <div className="flex-1 h-full relative z-[1]">
        {useGoogleMaps ? (
          <APIProvider apiKey={apiKey || ""}>
            <Map
              style={{ width: '100%', height: '100%' }}
              defaultCenter={safeCenter}
              defaultZoom={14}
              mapId="DEMO_MAP_ID"
              disableDefaultUI={false}
              zoomControl={true}
            >
              <MapBoundsUpdater mapData={mapData} safeCenter={safeCenter} />
              
              <AdvancedMarker 
                position={safeCenter}
                onClick={() => setActiveMarker('center')}
              >
                <Pin background={"#6366f1"} borderColor={"#ffffff"} glyphColor={"#ffffff"} />
              </AdvancedMarker>

              {activeMarker === 'center' && (
                <InfoWindow position={safeCenter} onCloseClick={() => setActiveMarker(null)}>
                      <div className="p-1">
                          <h3 className="font-bold text-gray-800 text-sm">Pusat Area Kantor</h3>
                      </div>
                </InfoWindow>
              )}

              {mapData.map(log => {
                if (!log.location || isNaN(parseFloat(log.location.lat as any)) || isNaN(parseFloat(log.location.lng as any))) return null;
                const position = { lat: parseFloat(log.location.lat as any), lng: parseFloat(log.location.lng as any) };
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
        ) : (
          <PureLeafletMap mapData={mapData} center={leafletCenter} />
        )}
        
        {mapData.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-gray-100 text-center pointer-events-none z-[1000] w-3/4 max-w-sm">
            <MapPin className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <h3 className="font-bold text-gray-800 text-lg">Belum Ada Absen Masuk</h3>
            <p className="text-sm text-gray-500 mt-1">Titik lokasi absen karyawan hari ini akan muncul di sini setelah ada yang melakukan absensi.</p>
          </div>
        )}
      </div>

      {/* Floating Side Panel */}
      <div className="w-80 h-full bg-white/90 backdrop-blur-md shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)] border-l border-gray-100 flex flex-col z-[10] overflow-hidden hidden md:flex absolute right-0 top-0 bottom-0">
        <div className="p-4 border-b border-gray-100 bg-white/50 shrink-0">
          <h3 className="font-extrabold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Aktivitas Hari Ini
          </h3>
          <p className="text-xs text-gray-500 mt-1">{mapData.length} data absen tercatat hari ini.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {mapData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-sm text-gray-400 italic">Belum ada aktivitas</p>
            </div>
          ) : (
            mapData.slice().sort((a,b) => b.timestamp - a.timestamp).map(log => (
              <div 
                key={log.id} 
                className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md
                  ${activeMarker === log.id ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-100 bg-white hover:border-indigo-200'}`}
                onClick={() => setActiveMarker(log.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-sm text-gray-800 line-clamp-1">{log.userName}</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                    {log.type}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-2">
                  <Clock className="w-3.5 h-3.5 opacity-70" />
                  {format(new Date(log.timestamp), 'HH:mm:ss')}
                </div>
                {log.location && (!isNaN(parseFloat(log.location.lat))) && (
                   <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 truncate">
                     <MapPin className="w-3 h-3" />
                     {parseFloat(log.location.lat).toFixed(4)}, {parseFloat(log.location.lng).toFixed(4)}
                   </div>
                )}
                {log.isFakeGPS && (
                  <div className="flex items-center gap-1 mt-2 text-xs font-bold text-red-500 bg-red-50 p-1.5 rounded-md border border-red-100">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Fake GPS
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
