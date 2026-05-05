import React, { useEffect, useState, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useSettings } from "../settingsObject";

interface MapPickerProps {
  center: { lat: number; lng: number };
  radius: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  readonly?: boolean;
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

function MapPickerInternal({ center, radius, onLocationSelect, readonly = false, apiKey }: MapPickerProps & { apiKey: string }) {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const safeCenter = {
    lat: isNaN(parseFloat(center.lat as any)) ? -6.2088 : parseFloat(center.lat as any),
    lng: isNaN(parseFloat(center.lng as any)) ? 106.8456 : parseFloat(center.lng as any)
  };

  useEffect(() => {
    if (map && safeCenter) {
      map.panTo(safeCenter);
    }
  }, [center, map]); // Need to watch original center for reference changes, pan to safeCenter

  const onMapClick = (e: any) => {
    if (readonly || !onLocationSelect || !e.detail.latLng) return;
    onLocationSelect(e.detail.latLng.lat, e.detail.latLng.lng);
  };

  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-teal-100 z-10 relative">
      <APIProvider apiKey={apiKey}>
        <Map
          style={containerStyle}
          defaultCenter={safeCenter}
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
          <AdvancedMarker position={safeCenter}>
            <Pin background={"#0d9488"} borderColor={"#ffffff"} glyphColor={"#ffffff"} />
          </AdvancedMarker>
          <CircleComponent center={safeCenter} radius={radius} />
        </Map>
      </APIProvider>
    </div>
  );
}

export function MapPicker(props: MapPickerProps) {
  const settings = useSettings();
  
  if (!settings?.googleMapsApiKey) {
    return (
      <div className="w-full h-[300px] rounded-xl overflow-hidden border border-teal-100 z-10 relative flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 text-center p-6">
        <p className="text-sm font-bold text-gray-400">Google Maps tidak ditampilkan</p>
        <p className="text-xs text-gray-500 mt-2">API Key belum diisi di menu Pengaturan.</p>
      </div>
    );
  }

  return <MapPickerInternal {...props} apiKey={settings.googleMapsApiKey} />;
}
