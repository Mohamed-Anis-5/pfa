import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import StatusBadge from "../shared/StatusBadge";

// Fix default Leaflet marker icons broken by Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function ComplaintsMap({ complaints, center = [36.8065, 10.1815] }) {
  return (
    <MapContainer
      center={center}
      zoom={12}
      className="w-full h-96 rounded-xl z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      {complaints
        .filter(c => c.latitude && c.longitude)
        .map(c => (
          <Marker key={c.complaintId} position={[c.latitude, c.longitude]}>
            <Popup>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{c.title}</p>
                <StatusBadge status={c.status} />
                <p className="text-gray-500">{c.categoryLabel}</p>
                <p className="text-gray-400 text-xs">
                  Due: {c.targetDate}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}