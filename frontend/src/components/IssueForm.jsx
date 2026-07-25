import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { reportIssue } from "../services/api";
import { Upload, MapPin, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function LocationPicker({ position, onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

const DEFAULT_CENTER = [20.5937, 78.9629];

export default function IssueForm() {
  const navigate = useNavigate();
  const fileRef = useRef();

  const [form, setForm] = useState({
    description: "",
    reporter_name: "",
    reporter_email: "",
    address: "",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [position, setPosition] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);
  const [drag, setDrag] = useState(false);

  function handleField(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function setFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Image must be under 10 MB");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setErrorMsg("");
  }

  function handleDrop(e) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) setFile(file);
  }

  function detectLocation() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => setGeoLoading(false)
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!image) { setErrorMsg("Please upload a photo of the issue."); return; }
    if (!position) { setErrorMsg("Please select a location on the map."); return; }
    if (!form.description.trim()) { setErrorMsg("Please describe the issue."); return; }

    setStatus("loading");
    setErrorMsg("");

    const fd = new FormData();
    fd.append("image", image);
    fd.append("description", form.description);
    fd.append("lat", position.lat);
    fd.append("lng", position.lng);
    if (form.address) fd.append("address", form.address);
    if (form.reporter_name) fd.append("reporter_name", form.reporter_name);
    if (form.reporter_email) fd.append("reporter_email", form.reporter_email);

    try {
      const data = await reportIssue(fd);
      setResult(data);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Submission failed. Check backend connection.");
      setStatus("error");
    }
  }

  if (status === "success" && result) {
    const SEVERITY_COLORS = { high: "text-red-600 bg-red-50", medium: "text-amber-600 bg-amber-50", low: "text-green-600 bg-green-50" };
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Issue Reported!</h2>
        <p className="text-gray-500 mb-8">Gemini has analysed your report and categorised the issue.</p>

        <div className="bg-white rounded-2xl shadow-md border text-left p-6 space-y-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full capitalize ${SEVERITY_COLORS[result.severity] || SEVERITY_COLORS.medium}`}>
              {result.severity} severity
            </span>
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 capitalize">
              {result.category?.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-gray-700">{result.summary}</p>
          <p className="text-sm text-gray-500">
            Responsible authority: <span className="font-medium text-gray-700">{result.authority}</span>
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setStatus(null); setResult(null); setImage(null); setPreview(null); setPosition(null); setForm({ description: "", reporter_name: "", reporter_email: "", address: "" }); }}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Report Another
          </button>
          <button
            onClick={() => navigate("/map")}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            View on Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Report a Civic Issue</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload a photo and Gemini AI will auto-categorise the issue and draft a complaint letter.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Photo <span className="text-red-500">*</span>
          </label>
          {preview ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImage(null); setPreview(null); }}
                className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-1.5 hover:bg-white shadow text-gray-700 text-xs font-medium"
              >
                Change
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                drag ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
            >
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 font-medium">Drop a photo here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP — max 10 MB</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleField}
            placeholder="Describe the issue briefly — e.g. 'Large pothole near the intersection causing traffic problems'"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Location */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">
              Location <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={detectLocation}
              disabled={geoLoading}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              <MapPin size={13} />
              {geoLoading ? "Detecting…" : "Use my location"}
            </button>
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 240 }}>
            <MapContainer
              center={position ? [position.lat, position.lng] : DEFAULT_CENTER}
              zoom={position ? 14 : 5}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationPicker position={position} onSelect={setPosition} />
            </MapContainer>
          </div>
          {position ? (
            <p className="text-xs text-green-700 mt-1.5 font-medium">
              Selected: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1.5">Click on the map to pin the issue location</p>
          )}
        </div>

        {/* Address (optional) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Address / Landmark <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            name="address"
            type="text"
            value={form.address}
            onChange={handleField}
            placeholder="e.g. Near City Hall, MG Road"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Reporter info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              name="reporter_name"
              type="text"
              value={form.reporter_name}
              onChange={handleField}
              placeholder="Anonymous"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              name="reporter_email"
              type="email"
              value={form.reporter_email}
              onChange={handleField}
              placeholder="for follow-up"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {status === "loading" ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analysing with Gemini AI…
            </>
          ) : (
            "Submit Issue Report"
          )}
        </button>
      </form>
    </div>
  );
}
