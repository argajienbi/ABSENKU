import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapPickerProps {
  center: { lat: number; lng: number };
  radius: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ position, radius, onLocationSelect }: { position: { lat: number; lng: number }, radius: number, onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <>
      <Marker position={position}></Marker>
      <Circle center={position} radius={radius} pathOptions={{ color: 'teal', fillColor: 'teal', fillOpacity: 0.2 }} />
    </>
  );
}

function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function MapPicker({ center, radius, onLocationSelect }: MapPickerProps) {
  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-teal-100 z-10 relative">
      <MapContainer center={center} zoom={15} scrollWheelZoom={true} style={{ height: "100%", width: "100%", zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={center} radius={radius} onLocationSelect={onLocationSelect} />
        <MapUpdater center={center} />
      </MapContainer>
    </div>
  );
}
