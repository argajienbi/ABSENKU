import React, { useEffect, useState, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useSettings } from "../settingsObject";

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

interface MapPickerProps {
  center: { lat: number; lng: number };
  radius: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  readonly?: boolean;
  userLocation?: { lat: number; lng: number };
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

const CircleComponent = ({ radius, center }: { radius: number, center: { lat: number, lng: number } }) => {
  const map = useMap();
  const [circle, setCircle] = useState<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;
    const c = new google.maps.Circle({
      map,
      radius,
      center,
      fillColor: '#0d9488', // teal-600
      fillOpacity: 0.2,
      strokeColor: '#0d9488',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      clickable: false,
    });
    setCircle(c);
    return () => {
      c.setMap(null);
    };
  }, [map, radius, center]);

  useEffect(() => {
    if (circle) {
      circle.setCenter(center);
      circle.setRadius(radius);
    }
  }, [circle, center, radius]);

  return null;
}

const AutocompleteComponent = ({ onLocationSelect, map }: { onLocationSelect: (lat: number, lng: number) => void, map: google.maps.Map | null }) => {
  const places = useMapsLibrary('places');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!places || !inputRef.current) return;
    const autocomplete = new places.Autocomplete(inputRef.current, {
       fields: ['geometry', 'place_id']
     });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
         onLocationSelect(place.geometry.location.lat(), place.geometry.location.lng());
         if (map) {
           map.panTo(place.geometry.location);
         }
      }
    });
  }, [places, onLocationSelect, map]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Cari lokasi atau alamat..."
      className="w-full h-10 px-4 py-2 bg-white rounded-lg shadow-md border-0 focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-800"
    />
  );
}

function MapPickerInternal({ center, radius, onLocationSelect, readonly = false, apiKey, userLocation }: MapPickerProps & { apiKey: string }) {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const safeCenter = {
    lat: isNaN(parseFloat(center.lat as any)) ? -6.2088 : parseFloat(center.lat as any),
    lng: isNaN(parseFloat(center.lng as any)) ? 106.8456 : parseFloat(center.lng as any)
  };

  const currentCenter = userLocation || safeCenter;

  useEffect(() => {
    if (map && currentCenter) {
      map.panTo(currentCenter);
    }
  }, [center, userLocation, map]);

  const onMapClick = (e: any) => {
    if (readonly || !onLocationSelect || !e.detail.latLng) return;
    onLocationSelect(e.detail.latLng.lat, e.detail.latLng.lng);
  };

  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-teal-100 z-10 relative">
      <APIProvider apiKey={apiKey}>
        <Map
          style={containerStyle}
          defaultCenter={currentCenter}
          defaultZoom={15}
          mapId="DEMO_MAP_ID"
          onClick={onMapClick}
          onBoundsChanged={(e) => {
            if (!map && e.map) {
               setMap(e.map);
            }
          }}
          disableDefaultUI={false}
          clickableIcons={false}
          scrollwheel={true}
        >
          {!readonly && onLocationSelect && (
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-[1000] w-[80%] max-w-sm">
              <AutocompleteComponent onLocationSelect={onLocationSelect} map={map} />
            </div>
          )}
          <AdvancedMarker position={safeCenter} zIndex={1}>
            <Pin background={"#0d9488"} borderColor={"#ffffff"} glyphColor={"#ffffff"} />
          </AdvancedMarker>
          {userLocation && (
             <AdvancedMarker position={userLocation} zIndex={2}>
               <Pin background={"#3b82f6"} borderColor={"#ffffff"} glyphColor={"#ffffff"} />
             </AdvancedMarker>
          )}
          <CircleComponent center={safeCenter} radius={radius} />
        </Map>
      </APIProvider>
    </div>
  );
}

function LeafletMapPicker({ center, radius, userLocation, readonly, onLocationSelect }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const safeLat = isNaN(parseFloat(center.lat as any)) ? -6.2088 : parseFloat(center.lat as any);
  const safeLng = isNaN(parseFloat(center.lng as any)) ? 106.8456 : parseFloat(center.lng as any);
  const pos: [number, number] = [safeLat, safeLng];

  const currentUserLocation: [number, number] | undefined = userLocation ? [
    parseFloat(userLocation.lat as any),
    parseFloat(userLocation.lng as any)
  ] : undefined;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(currentUserLocation || pos, 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
      
      mapRef.current.on('click', (e) => {
        if (!readonly && onLocationSelect) {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
      });
    }

    const map = mapRef.current;

    if (!markerRef.current) {
      markerRef.current = L.marker(pos, { draggable: !readonly }).addTo(map);
      markerRef.current.on('dragend', (e) => {
        const marker = e.target;
        const position = marker.getLatLng();
        if (onLocationSelect) onLocationSelect(position.lat, position.lng);
      });
      markerRef.current.bindPopup("Titik Absensi");
    } else {
      markerRef.current.setLatLng(pos);
      if (readonly) {
        markerRef.current.dragging?.disable();
      } else {
        markerRef.current.dragging?.enable();
      }
    }

    if (currentUserLocation) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker(currentUserLocation, { 
          icon: L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/1144/1144760.png',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(map);
        userMarkerRef.current.bindPopup("Lokasi Anda");
      } else {
        userMarkerRef.current.setLatLng(currentUserLocation);
      }
    }

    if (!circleRef.current) {
      circleRef.current = L.circle(pos, {
        radius: radius,
        fillColor: '#0d9488',
        fillOpacity: 0.2,
        color: '#0d9488',
        weight: 2
      }).addTo(map);
    } else {
      circleRef.current.setLatLng(pos);
      circleRef.current.setRadius(radius);
    }

    // map.panTo(currentUserLocation || pos);

  }, [center.lat, center.lng, radius, userLocation, readonly]);

  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-teal-100 z-10 relative">
      <div ref={mapContainerRef} className="w-full h-full" />
      {!readonly && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 p-2 rounded-lg shadow-md text-[10px] font-bold text-teal-700 pointer-events-none">
          Klik peta atau geser marker untuk mengubah lokasi
        </div>
      )}
    </div>
  );
}

export function MapPicker(props: MapPickerProps) {
  const settings = useSettings();
  
  if (settings?.useGoogleMaps && settings?.googleMapsApiKey) {
    return <MapPickerInternal {...props} apiKey={settings.googleMapsApiKey} />;
  }

  // Fallback to Leaflet if useGoogleMaps is false OR apiKey is missing
  return <LeafletMapPicker {...props} />;
}
