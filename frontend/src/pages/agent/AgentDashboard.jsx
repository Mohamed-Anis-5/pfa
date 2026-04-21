import { useEffect, useState } from "react";
import Navbar from "../../components/shared/Navbar";
import StatusBadge from "../../components/shared/StatusBadge";
import api from "../../api/axios";

export default function AgentDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [file, setFile] = useState({});
  const [resolutionComment, setResolutionComment] = useState({});

  useEffect(() => {
    api.get("/complaints/assigned").then(r => setComplaints(r.data));
  }, []);

  const updateStatus = async (id, newStatus, note) => {
    await api.put(`/complaints/${id}/status`, { newStatus, note: note || null });
    const { data } = await api.get("/complaints/assigned");
    setComplaints(data);
  };

  const uploadPhoto = async (id) => {
    if (!file[id]) return;
    const fd = new FormData();
    fd.append("file", file[id]);
    await api.post(`/complaints/${id}/attachments`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 space-y-4 mt-4">
        <h2 className="text-xl font-bold text-gray-800">My Assigned Tasks</h2>

        {complaints.length === 0 && (
          <p className="text-gray-500 text-center py-10">No tasks assigned yet.</p>
        )}

        {complaints.map(c => (
          <div key={c.complaintId} className="bg-white rounded-2xl shadow p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">{c.title}</h3>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-sm text-gray-500">{c.description}</p>
            <div className="flex gap-4 text-xs text-gray-400">
              <span>📂 {c.categoryLabel}</span>
              <span>📅 Due: {c.targetDate}</span>
              <span>⚠️ {c.priority}</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {c.status === "ASSIGNED" && (
                <button
                  onClick={() => updateStatus(c.complaintId, "IN_PROGRESS")}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition"
                >
                  ▶ Start Work
                </button>
              )}
              {c.status === "IN_PROGRESS" && (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/*" className="text-xs"
                      onChange={e => setFile({ ...file, [c.complaintId]: e.target.files[0] })}
                    />
                    <button onClick={() => uploadPhoto(c.complaintId)}
                      className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300">
                      Upload Photo
                    </button>
                  </div>
                  <textarea
                    placeholder="Resolution comment (optional)"
                    rows={2}
                    className="w-full border rounded px-3 py-2 text-sm resize-none"
                    value={resolutionComment[c.complaintId] || ""}
                    onChange={e => setResolutionComment({ ...resolutionComment, [c.complaintId]: e.target.value })}
                  />
                  <button
                    onClick={() => updateStatus(c.complaintId, "RESOLVED", resolutionComment[c.complaintId])}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                  >
                    ✅ Mark as Resolved
                  </button>
                </div>
              )}
              {(c.status === "RESOLVED" || c.status === "CLOSED") && (
                <span className="text-green-600 text-sm font-medium">✅ Completed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}