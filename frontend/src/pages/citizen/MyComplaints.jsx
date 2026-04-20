import { useEffect, useState } from "react";
import Navbar from "../../components/shared/Navbar";
import StatusBadge from "../../components/shared/StatusBadge";
import StarRating from "../../components/shared/StarRating";
import api from "../../api/axios";

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [ratingFor,  setRatingFor]  = useState(null);

  useEffect(() => {
    api.get("/complaints/my").then(r => setComplaints(r.data));
  }, []);

  const handleFeedback = async (id, payload) => {
    await api.post(`/complaints/${id}/feedback`, payload);
    setRatingFor(null);
    const { data } = await api.get("/complaints/my");
    setComplaints(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={[
        { to: "/citizen",        label: "Home" },
        { to: "/citizen/submit", label: "New Complaint" },
      ]} />
      <div className="max-w-2xl mx-auto p-6 space-y-4 mt-4">
        <h2 className="text-xl font-bold text-gray-800">My Complaints</h2>

        {complaints.length === 0 && (
          <p className="text-gray-500 text-center py-10">No complaints yet.</p>
        )}

        {complaints.map(c => (
          <div key={c.complaintId} className="bg-white rounded-2xl shadow p-5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">{c.title}</h3>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-sm text-gray-500">{c.description}</p>
            <div className="flex gap-4 text-xs text-gray-400">
              <span>📂 {c.categoryLabel}</span>
              <span>📅 Due: {c.targetDate}</span>
              {c.assignedAgentEmail && <span>👷 {c.assignedAgentEmail}</span>}
            </div>

            {/* Rating interface — only for RESOLVED complaints */}
            {c.status === "RESOLVED" && ratingFor !== c.complaintId && (
              <button
                onClick={() => setRatingFor(c.complaintId)}
                className="text-sm text-blue-600 hover:underline mt-1"
              >
                ⭐ Rate this service
              </button>
            )}
            {ratingFor === c.complaintId && (
              <StarRating onSubmit={payload => handleFeedback(c.complaintId, payload)} />
            )}
            {c.status === "CLOSED" && (
              <p className="text-xs text-green-600 font-medium">✅ Feedback submitted</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}