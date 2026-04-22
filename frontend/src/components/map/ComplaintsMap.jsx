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
  const complaintsWithCoordinates = complaints.filter((complaint) => complaint.latitude != null && complaint.longitude != null);
  const complaintsWithoutCoordinates = complaints.filter((complaint) => complaint.streetName && (complaint.latitude == null || complaint.longitude == null));

  return (
    <section aria-labelledby="complaints-map-heading" className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="civic-kicker">Map view</p>
          <h3 id="complaints-map-heading" className="mt-2 text-3xl tracking-[-0.03em] text-[#16372d]">
            Complaint locations
          </h3>
        </div>
        <p id="complaints-map-description" className="max-w-xl text-sm leading-7 text-[#5d736b]">
          Use the map to review complaint markers and open details for each location.
        </p>
      </div>

      {complaintsWithoutCoordinates.length > 0 && (
        <div className="rounded-[1.25rem] border border-[#ef7a1a]/14 bg-[#fff7ef] px-4 py-3 text-sm leading-7 text-[#8b4a0d]">
          {complaintsWithoutCoordinates.length} complaint{complaintsWithoutCoordinates.length === 1 ? " is" : "s are"} listed with a street name only and cannot be placed on the map until GPS coordinates are available.
        </div>
      )}

      <div className="overflow-hidden rounded-[1.8rem] border border-[#16372d]/8 bg-white/82 p-2 shadow-[0_18px_40px_rgba(22,55,45,0.08)]">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={false}
          aria-label="Map of complaint locations"
          aria-describedby="complaints-map-description"
          className="z-0 h-72 w-full rounded-[1.35rem] sm:h-80 lg:h-96"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          {complaintsWithCoordinates.map(c => (
              <Marker
                key={c.complaintId}
                position={[c.latitude, c.longitude]}
                title={c.title}
                alt={`Complaint location for ${c.title}`}
              >
                <Popup>
                  <div className="space-y-1.5 text-sm">
                    <p className="font-semibold text-[#16372d]">{c.title}</p>
                    <StatusBadge status={c.status} />
                    <p className="text-[#5d736b]">{c.categoryLabel}</p>
                    {c.streetName && <p className="text-[#5d736b]">{c.streetName}</p>}
                    <p className="text-xs text-[#73867f]">
                      Due: {c.targetDate}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </section>
  );
}