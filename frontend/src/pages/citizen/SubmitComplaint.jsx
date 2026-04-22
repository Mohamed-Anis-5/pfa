import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/shared/Navbar";
import api from "../../api/axios";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function getApiErrorMessage(err, fallbackMessage) {
  if (err.response?.status === 401 || err.response?.status === 403) {
    return "Session expired. Please sign in again.";
  }

  if (err.response?.data?.message) {
    return err.response.data.message;
  }

  if (err.response?.data?.error) {
    return err.response.data.error;
  }

  if (err.response?.statusText) {
    return `Error: ${err.response.statusText}`;
  }

  if (err.message) {
    return `Error: ${err.message}`;
  }

  return fallbackMessage;
}

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "", description: "", priority: "Medium",
    categoryId: "", latitude: null, longitude: null, streetName: "",
  });
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [locMsg,  setLocMsg]  = useState("");
  const [gpsError, setGpsError] = useState(false);
  const [error,   setError]   = useState("");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setFile(null);
      setError("Please choose an image file for the complaint photo.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_IMAGE_SIZE_BYTES) {
      setFile(null);
      setError("Image upload is limited to 10 MB. Please choose a smaller photo.");
      event.target.value = "";
      return;
    }

    setError("");
    setFile(selectedFile);
  };

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
        setLocMsg("GPS unavailable — please enter the street name instead.");
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

    const hasCoordinates = form.latitude != null && form.longitude != null;
    const hasStreetName = form.streetName.trim().length > 0;

    if (!hasCoordinates && !hasStreetName) {
      setError("Location is required. Capture your GPS location or enter the street name.");
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
        try {
          const fd = new FormData();
          fd.append("file", file);
          await api.post(`/complaints/${data.complaintId}/attachments`, fd);
        } catch (attachmentError) {
          console.error("Complaint attachment error:", attachmentError.response?.data || attachmentError.message);
          navigate("/citizen/complaints", {
            state: {
              notice: `Complaint submitted successfully, but the photo could not be uploaded. ${getApiErrorMessage(attachmentError, "You can retry later from support if needed.")}`,
            },
          });
          return;
        }
      }

      navigate("/citizen/complaints");
    } catch (err) {
      console.error("Complaint submission error:", err.response?.data || err.message);
      setError(getApiErrorMessage(err, "Submission failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="civic-internal-page">
      <Navbar links={[{ to: "/citizen", label: "← Back" }]} />
      <main className="civic-internal-main grid gap-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
        <section className="civic-panel rounded-[2rem] px-6 py-7 sm:px-8">
          <p className="civic-kicker">New complaint</p>
          <h1 className="mt-3 text-5xl leading-[1.04] tracking-[-0.05em] text-[#16372d] sm:text-6xl">Tell the city what needs attention.</h1>
          <p className="mt-5 text-base leading-8 text-[#5d736b]">
            Give the issue a clear title, category, location, and supporting evidence so municipal teams can route it quickly.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Use a precise title so the issue is easy to scan in dashboards.",
              "Attach your location to avoid routing delays.",
              "Add a photo when visual evidence will help field teams act faster.",
            ].map((tip) => (
              <div key={tip} className="rounded-[1.35rem] border border-[#16372d]/8 bg-white/72 px-4 py-4 text-sm leading-7 text-[#5d736b]">
                {tip}
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="civic-panel rounded-[2rem] p-6 space-y-4 sm:p-8" aria-describedby={error ? "submit-complaint-error" : undefined}>

          <div className="civic-field">
            <label htmlFor="complaint-title">Title</label>
            <input id="complaint-title" name="title" required
              placeholder="Describe the problem briefly"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="civic-field">
            <label htmlFor="complaint-category">Category</label>
            <select id="complaint-category" name="categoryId" required
              value={form.categoryId}
              onChange={e => setForm({ ...form, categoryId: e.target.value ? parseInt(e.target.value, 10) : "" })}
            >
              <option value="">Select category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            {categories.length === 0 && !error && (
              <p className="text-xs text-[#5d736b] mt-1">No categories available.</p>
            )}
          </div>

          <div className="civic-field">
            <label htmlFor="complaint-priority">Priority</label>
            <select
              id="complaint-priority"
              name="priority"
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}
            >
              {["Low","Medium","High","Emergency"].map(p => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="civic-field">
            <label htmlFor="complaint-description">Description</label>
            <textarea id="complaint-description" name="description" required rows={3}
              minLength={10}
              placeholder="Explain what is happening, why it matters, and what someone on-site would see."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="civic-field">
            <label htmlFor="complaint-photo">Photo (optional)</label>
            <input id="complaint-photo" name="photo" type="file" accept="image/*"
              className="text-sm"
              onChange={handleFileChange}
            />
            <p className="mt-1 text-xs leading-6 text-[#5d736b]">Accepted formats: images only, up to 10 MB.</p>
          </div>

          <div className="space-y-3 rounded-[1.35rem] border border-[#16372d]/8 bg-[#f6efe3] p-4">
            <div>
              <p className="text-sm font-semibold text-[#16372d]">Location</p>
              <p className="mt-1 text-sm leading-7 text-[#5d736b]">Capture your current position when it works, or enter the street name if GPS is unavailable.</p>
            </div>
            <button type="button"
              onClick={captureLocation}
              aria-describedby={locMsg ? "complaint-location-status" : undefined}
              className="civic-button-secondary"
            >
              Capture my location
            </button>
            {locMsg && (
              <p
                id="complaint-location-status"
                aria-live="polite"
                className={`text-sm ${gpsError ? 'text-[#9a5b19]' : 'text-[#4f655d]'}`}
              >
                {locMsg}
              </p>
            )}
            <div className="civic-field">
              <label htmlFor="complaint-street-name">Street name</label>
              <input
                id="complaint-street-name"
                name="streetName"
                type="text"
                placeholder="Example: Habib Bourguiba Avenue, near the central school"
                value={form.streetName}
                onChange={e => setForm(f => ({ ...f, streetName: e.target.value }))}
              />
              <p className="text-xs leading-6 text-[#5d736b]">
                Use this when GPS is not available or when the street name will help teams find the issue faster.
              </p>
            </div>
            {gpsError && (
              <p className="text-sm text-[#9a5b19]">
                GPS is not available on this device right now. Street name submission is enabled.
              </p>
            )}
          </div>

          {error && <p id="submit-complaint-error" role="alert" className="civic-alert">{error}</p>}

          <button type="submit" disabled={loading}
            className="civic-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      </main>
    </div>
  );
}