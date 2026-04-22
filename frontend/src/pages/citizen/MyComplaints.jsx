import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/shared/Navbar";
import StatusBadge from "../../components/shared/StatusBadge";
import StarRating from "../../components/shared/StarRating";
import api from "../../api/axios";

export default function MyComplaints() {
  const location = useLocation();
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
    <div className="civic-internal-page">
      <Navbar links={[
        { to: "/citizen",        label: "Home" },
        { to: "/citizen/submit", label: "New Complaint" },
      ]} />
      <main className="civic-internal-main space-y-6">
        {location.state?.notice && (
          <div className="civic-panel rounded-[1.5rem] border border-[#ef7a1a]/14 bg-[#fff8ef] px-6 py-4 text-sm leading-7 text-[#8b4a0d]">
            {location.state.notice}
          </div>
        )}

        <section className="civic-panel rounded-[2rem] px-6 py-7 sm:px-8">
          <p className="civic-kicker">My reports</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-5xl leading-[1.04] tracking-[-0.05em] text-[#16372d] sm:text-6xl">Track every complaint from first report to closure.</h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[#5d736b]">
                Review current statuses, due dates, assigned teams, and completed work notes in a cleaner timeline-style view.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[#16372d]/8 bg-white/72 px-5 py-4 text-sm text-[#5a7069] shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7e78]">Total complaints</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#16372d]">{complaints.length}</p>
            </div>
          </div>
        </section>

        {complaints.length === 0 && (
          <div className="civic-panel rounded-[1.75rem] px-6 py-10 text-center text-[#5d736b]">
            No complaints yet.
          </div>
        )}

        {complaints.map(c => (
          <article key={c.complaintId} className="civic-panel rounded-[1.85rem] px-6 py-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7e78]">Complaint report</p>
                <h2 className="mt-2 text-3xl tracking-[-0.03em] text-[#16372d]">{c.title}</h2>
              </div>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-sm leading-7 text-[#587068]">{c.description}</p>
            <div className="flex flex-wrap gap-3 text-xs font-medium text-[#5b7169]">
              <span className="rounded-full bg-[#f6efe3] px-3 py-1.5">Category: {c.categoryLabel}</span>
              <span className="rounded-full bg-[#f6efe3] px-3 py-1.5">Due: {c.targetDate}</span>
              {c.streetName && <span className="rounded-full bg-[#f6efe3] px-3 py-1.5">Street: {c.streetName}</span>}
              {c.assignedAgentEmail && <span className="rounded-full bg-[#f6efe3] px-3 py-1.5">Assigned: {c.assignedAgentEmail}</span>}
            </div>

            {(c.status === "RESOLVED" || c.status === "CLOSED") && (
              <div className="rounded-[1.3rem] border border-[#9acdb3] bg-[#edf9f1] p-4 space-y-2">
                {c.resolvedAt && (
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1f6942]">
                    Resolved on {new Date(c.resolvedAt).toLocaleDateString()}
                  </p>
                )}
                {c.resolutionComment && (
                  <p className="text-sm leading-7 text-[#345347]">
                    <span className="font-semibold">Resolution note: </span>{c.resolutionComment}
                  </p>
                )}
              </div>
            )}

            {c.status === "RESOLVED" && ratingFor !== c.complaintId && (
              <button
                onClick={() => setRatingFor(c.complaintId)}
                className="civic-button-secondary"
              >
                Rate this service
              </button>
            )}
            {ratingFor === c.complaintId && (
              <StarRating onSubmit={payload => handleFeedback(c.complaintId, payload)} />
            )}
            {c.status === "CLOSED" && (
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1f6942]">Feedback submitted</p>
            )}
          </article>
        ))}
      </main>
    </div>
  );
}