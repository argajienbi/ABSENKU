import React, { useEffect, useState, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, Circle, Autocomplete } from "@react-google-maps/api";
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

// Define libraries outside component to avoid re-renders
const LIBRARIES: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

function MapPickerInternal({ center, radius, onLocationSelect, readonly = false, apiKey }: MapPickerProps & { apiKey: string }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map)
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null)
  }, []);

  const safeCenter = {
    lat: isNaN(parseFloat(center.lat as any)) ? -6.2088 : parseFloat(center.lat as any),
    lng: isNaN(parseFloat(center.lng as any)) ? 106.8456 : parseFloat(center.lng as any)
  };

  useEffect(() => {
    if (map && safeCenter) {
      map.panTo(safeCenter);
    }
  }, [center, map]); // Need to watch original center for reference changes, pan to safeCenter

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (readonly || !onLocationSelect || !e.latLng) return;
    onLocationSelect(e.latLng.lat(), e.latLng.lng());
  }, [onLocationSelect, readonly]);

  const onLoadAutocomplete = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location && onLocationSelect) {
        onLocationSelect(place.geometry.location.lat(), place.geometry.location.lng());
      }
    }
  };

  return isLoaded ? (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-teal-100 z-10 relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={safeCenter}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={{
          disableDefaultUI: false,
          clickableIcons: false,
          scrollwheel: true
        }}
      >
        {!readonly && onLocationSelect && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-[1000] w-[80%] max-w-sm">
            <Autocomplete onLoad={onLoadAutocomplete} onPlaceChanged={onPlaceChanged}>
              <input
                type="text"
                placeholder="Cari lokasi atau alamat..."
                className="w-full h-10 px-4 py-2 bg-white rounded-lg shadow-md border-0 focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-800"
              />
            </Autocomplete>
          </div>
        )}
        <Marker position={safeCenter} />
        <Circle 
          center={safeCenter} 
          radius={radius} 
          options={{
            fillColor: '#0d9488', // teal-600
            fillOpacity: 0.2,
            strokeColor: '#0d9488',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            clickable: false,
          }} 
        />
      </GoogleMap>
    </div>
  ) : (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-teal-100 z-10 relative flex items-center justify-center bg-gray-100/50 dark:bg-gray-800/50 animate-pulse">
      <span className="text-sm font-bold text-gray-400">Memuat Peta...</span>
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
