import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/shared/Navbar";
import api from "../../api/axios";

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "", description: "", priority: "Medium",
    categoryId: "", latitude: null, longitude: null,
  });
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [locMsg,  setLocMsg]  = useState("");
  const [gpsError, setGpsError] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.get("/categories")
      .then(r => setCategories(r.data))
      .catch(err => {
        const msg = err.response?.data?.message || "Unable to load categories";
        setError(msg);
      });
  }, []);

  const captureLocation = () => {
    setLocMsg("Detecting location...");
    setGpsError(false);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setLocMsg(`📍 ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      },
      () => {
        setLocMsg("GPS unavailable — please enter coordinates manually.");
        setGpsError(true);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.categoryId) {
      setError("Please select a complaint category.");
      return;
    }

    if (form.latitude == null || form.longitude == null) {
      setError("Location is required. Please capture your location before submitting.");
      return;
    }

    if (!form.description || form.description.trim().length < 10) {
      setError("Description must contain at least 10 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/complaints", form);
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        await api.post(`/complaints/${data.complaintId}/attachments`, fd);
      }
      navigate("/citizen/complaints");
    } catch (err) {
      console.error("Complaint submission error:", err.response?.data || err.message);
      let message = "Submission failed";
      if (err.response?.status === 401 || err.response?.status === 403) {
        message = "Session expired. Please sign in again.";
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.response?.statusText) {
        message = `Error: ${err.response.statusText}`;
      } else if (err.message) {
        message = `Error: ${err.message}`;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={[{ to: "/citizen", label: "← Back" }]} />
      <div className="max-w-lg mx-auto p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Submit a Complaint</h2>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-6 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input required
              className="w-full border rounded-lg px-3 py-2"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select required
              className="w-full border rounded-lg px-3 py-2"
              value={form.categoryId}
              onChange={e => setForm({ ...form, categoryId: e.target.value ? parseInt(e.target.value, 10) : "" })}
            >
              <option value="">Select category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            {categories.length === 0 && !error && (
              <p className="text-xs text-gray-500 mt-1">No categories available.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}
            >
              {["Low","Medium","High","Emergency"].map(p => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required rows={3}
              minLength={10}
              className="w-full border rounded-lg px-3 py-2"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
            <input type="file" accept="image/*"
              className="w-full text-sm"
              onChange={e => setFile(e.target.files[0])}
            />
          </div>

          <div>
            <button type="button"
              onClick={captureLocation}
              className="bg-gray-100 border rounded-lg px-4 py-2 text-sm hover:bg-gray-200 transition"
            >
              📍 Capture My Location
            </button>
            {locMsg && <p className={`text-xs mt-1 ${gpsError ? 'text-orange-500' : 'text-gray-500'}`}>{locMsg}</p>}
            {gpsError && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Latitude</label>
                  <input type="number" step="any"
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="e.g. 36.8065"
                    value={form.latitude ?? ""}
                    onChange={e => setForm(f => ({ ...f, latitude: e.target.value ? parseFloat(e.target.value) : null }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Longitude</label>
                  <input type="number" step="any"
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="e.g. 10.1815"
                    value={form.longitude ?? ""}
                    onChange={e => setForm(f => ({ ...f, longitude: e.target.value ? parseFloat(e.target.value) : null }))}
                  />
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading || form.latitude == null || form.longitude == null}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      </div>
    </div>
  );
}