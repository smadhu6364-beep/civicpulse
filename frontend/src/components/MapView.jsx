import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { fetchIssues } from "../services/api";
import IssueModal from "./IssueModal";
import { AlertTriangle, RefreshCw } from "lucide-react";

// Fix Leaflet default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SEVERITY_COLORS = { high: "#DC2626", medium: "#D97706", low: "#15803D" };

function createPin(severity) {
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.medium;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:22px;height:22px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid white;
      transform:rotate(-45deg);
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -24],
  });
}

function FitBounds({ issues }) {
  const map = useMap();
  useEffect(() => {
    if (!issues.length) return;
    const bounds = L.latLngBounds(
      issues.map((i) => [i.location.lat, i.location.lng])
    );
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60] });
  }, [issues, map]);
  return null;
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 0);
  }, [map]);
  return null;
}

const LEGEND = [
  { label: "High severity", color: SEVERITY_COLORS.high },
  { label: "Medium severity", color: SEVERITY_COLORS.medium },
  { label: "Low severity", color: SEVERITY_COLORS.low },
];

export default function MapView() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIssues();
      setIssues(data);
    } catch {
      setError("Failed to load issues. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleUpvoted(id, newCount) {
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, upvotes: newCount } : i))
    );
    if (selected?.id === id) setSelected((s) => ({ ...s, upvotes: newCount }));
  }

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Status bar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {loading ? "Loading issues…" : `${issues.length} issues reported`}
        </span>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: "calc(100vh - 120px)", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <InvalidateSize />
          {issues.length > 0 && <FitBounds issues={issues} />}

          {issues.map((issue) => (
            <Marker
              key={issue.id}
              position={[issue.location.lat, issue.location.lng]}
              icon={createPin(issue.severity)}
              eventHandlers={{ click: () => setSelected(issue) }}
            >
              <Popup>
                <div className="text-sm min-w-[180px]">
                  <p className="font-semibold capitalize mb-1">
                    {issue.category?.replace(/_/g, " ")}
                  </p>
                  <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                    {issue.summary || issue.description}
                  </p>
                  <button
                    onClick={() => setSelected(issue)}
                    className="text-blue-600 text-xs font-medium hover:underline"
                  >
                    View details →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-4 bg-white rounded-xl shadow-lg p-3 z-[999] border">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Severity</p>
        {LEGEND.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-700">{label}</span>
          </div>
        ))}
      </div>

      {selected && (
        <IssueModal
          issue={selected}
          onClose={() => setSelected(null)}
          onUpvoted={handleUpvoted}
        />
      )}
    </div>
  );
}
