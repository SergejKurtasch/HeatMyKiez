import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/** Fix default marker icon in react-leaflet (webpack/vite). */
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

export interface BuildingMapProps {
  lat: number;
  lng: number;
  address?: string | null;
}

/**
 * Displays a map with a marker at the given coordinates.
 * Shown when building coordinates are available.
 */
export function BuildingMap({ lat, lng, address }: BuildingMapProps) {
  const position: [number, number] = useMemo(() => [lat, lng], [lat, lng]);

  return (
    <div className="building-map-wrapper">
      <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom={true}
        className="building-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>{address ?? "Building location"}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
