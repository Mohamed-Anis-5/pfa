import { useEffect, useState } from "react";
import Navbar from "../../components/shared/Navbar";
import StatusBadge from "../../components/shared/StatusBadge";
import api from "../../api/axios";

function formatDate(value) {
  if (!value) return "No date set";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getTaskRank(status) {
  const rankByStatus = {
    IN_PROGRESS: 0,
    ASSIGNED: 1,
    RESOLVED: 2,
    CLOSED: 3,
    ARCHIVED: 4,
    CANCELLED: 5,
    REJECTED: 6,
  };

  return rankByStatus[status] ?? 99;
}

export default function AgentDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [selectedFileByComplaintId, setSelectedFileByComplaintId] = useState({});
  const [resolutionComment, setResolutionComment] = useState({});
  const [uploadNoticeByComplaintId, setUploadNoticeByComplaintId] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [uploadingComplaintId, setUploadingComplaintId] = useState(null);
  const [savingComplaintId, setSavingComplaintId] = useState(null);

  const reloadAssignedComplaints = async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true);
    }

    try {
      const response = await api.get("/complaints/assigned");
      setComplaints(Array.isArray(response.data) ? response.data : []);
      setLoadError("");
    } catch {
      setLoadError("Unable to load your assigned complaints right now.");
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadInitialAssignedComplaints = async () => {
      try {
        const response = await api.get("/complaints/assigned");
        if (!isActive) {
          return;
        }
        setComplaints(Array.isArray(response.data) ? response.data : []);
        setLoadError("");
      } catch {
        if (isActive) {
          setLoadError("Unable to load your assigned complaints right now.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadInitialAssignedComplaints();

    return () => {
      isActive = false;
    };
  }, []);

  const updateStatus = async (id, newStatus, note) => {
    setSavingComplaintId(id);
    setLoadError("");

    try {
      await api.put(`/complaints/${id}/status`, { newStatus, note: note || null });
      await reloadAssignedComplaints(false);
    } catch {
      setLoadError("Unable to update that complaint right now.");
    } finally {
      setSavingComplaintId(null);
    }
  };

  const uploadPhoto = async (id) => {
    if (!selectedFileByComplaintId[id]) {
      setUploadNoticeByComplaintId((previousState) => ({
        ...previousState,
        [id]: "Choose a photo before uploading.",
      }));
      return;
    }

    setUploadingComplaintId(id);

    try {
      const formData = new FormData();
      formData.append("file", selectedFileByComplaintId[id]);

      await api.post(`/complaints/${id}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadNoticeByComplaintId((previousState) => ({
        ...previousState,
        [id]: "Photo uploaded successfully.",
      }));
    } catch {
      setUploadNoticeByComplaintId((previousState) => ({
        ...previousState,
        [id]: "Photo upload failed. Try again.",
      }));
    } finally {
      setUploadingComplaintId(null);
    }
  };

  const sortedComplaints = [...complaints].sort((leftComplaint, rightComplaint) => {
    const statusRankDifference = getTaskRank(leftComplaint.status) - getTaskRank(rightComplaint.status);
    if (statusRankDifference !== 0) {
      return statusRankDifference;
    }

    return String(leftComplaint.targetDate ?? "").localeCompare(String(rightComplaint.targetDate ?? ""));
  });

  const assignedCount = complaints.filter((complaint) => complaint.status === "ASSIGNED").length;
  const inProgressCount = complaints.filter((complaint) => complaint.status === "IN_PROGRESS").length;
  const completedCount = complaints.filter((complaint) => ["RESOLVED", "CLOSED"].includes(complaint.status)).length;
  const nextDueComplaint = sortedComplaints.find((complaint) => ["ASSIGNED", "IN_PROGRESS"].includes(complaint.status));

  return (
    <div className="civic-internal-page">
      <Navbar />
      <main className="civic-internal-main space-y-8">
        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="relative overflow-hidden rounded-[2.2rem] border border-[#ef7a1a]/14 bg-[linear-gradient(180deg,#fff9f3_0%,#ffe9d2_100%)] shadow-[0_24px_58px_rgba(239,122,26,0.12)]">
            <div className="absolute -left-10 top-8 h-36 w-36 rounded-full bg-[#ffd3a8]/40 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#16372d]/10 blur-3xl" />
            <div className="relative px-6 py-7 sm:px-8">
              <p className="civic-kicker !text-[#a45d16]">Field operations</p>
              <h1 className="mt-3 text-5xl leading-[1.03] tracking-[-0.05em] text-[#16372d] sm:text-6xl">
                Turn assigned complaints into clear, documented field progress.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#5d736b]">
                Review your queue, upload evidence from the field, and move complaints to resolution with structured notes instead of scattered updates.
              </p>
              {loadError && (
                <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[1.35rem] border border-[#ef7a1a]/14 bg-white/84 px-4 py-3 text-sm text-[#8b4a0d]">
                  <span>{loadError}</span>
                  <button
                    type="button"
                    onClick={() => reloadAssignedComplaints()}
                    className="rounded-full border border-[#ef7a1a]/18 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#a45d16] transition hover:bg-white"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-[1.8rem] bg-[#16372d] px-6 py-6 text-[#f7f2e8] shadow-[0_20px_42px_rgba(22,55,45,0.18)]">
              <p className="civic-kicker !text-[#cfddd8]">Assigned tasks</p>
              <p className="mt-3 text-6xl font-semibold tracking-[-0.06em]">{complaints.length}</p>
              <p className="mt-4 text-sm leading-7 text-[#d6e2dd]">All complaints currently assigned to you.</p>
            </article>
            <article className="rounded-[1.8rem] border border-[#ef7a1a]/14 bg-[#fff4e8] px-6 py-6 shadow-[0_18px_38px_rgba(239,122,26,0.1)]">
              <p className="civic-kicker !text-[#a45d16]">Next due date</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#8b4a0d]">
                {nextDueComplaint ? formatDate(nextDueComplaint.targetDate) : "No active due date"}
              </p>
              <p className="mt-4 text-sm leading-7 text-[#8b4a0d]">
                {nextDueComplaint ? nextDueComplaint.title : "No assigned or in-progress complaints right now."}
              </p>
            </article>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.65rem] border border-[#16372d]/8 bg-white/86 px-6 py-5 shadow-[0_18px_38px_rgba(22,55,45,0.08)]">
            <p className="civic-kicker">Waiting to start</p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#16372d]">{assignedCount}</p>
            <p className="mt-2 text-sm leading-7 text-[#5d736b]">Complaints assigned and ready for field work.</p>
          </article>
          <article className="rounded-[1.65rem] border border-[#16372d]/8 bg-white/86 px-6 py-5 shadow-[0_18px_38px_rgba(22,55,45,0.08)]">
            <p className="civic-kicker">In progress</p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#16372d]">{inProgressCount}</p>
            <p className="mt-2 text-sm leading-7 text-[#5d736b]">Complaints currently being worked on in the field.</p>
          </article>
          <article className="rounded-[1.65rem] border border-[#16372d]/8 bg-white/86 px-6 py-5 shadow-[0_18px_38px_rgba(22,55,45,0.08)]">
            <p className="civic-kicker">Completed</p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#16372d]">{completedCount}</p>
            <p className="mt-2 text-sm leading-7 text-[#5d736b]">Complaints already resolved or closed.</p>
          </article>
        </section>

        {isLoading ? (
          <section className="rounded-[1.9rem] border border-[#16372d]/8 bg-white/84 px-6 py-12 text-center text-[#5d736b] shadow-[0_18px_40px_rgba(22,55,45,0.08)]">
            Loading assigned tasks...
          </section>
        ) : complaints.length === 0 ? (
          <section className="rounded-[1.9rem] border border-[#16372d]/8 bg-white/84 px-6 py-10 text-center shadow-[0_18px_40px_rgba(22,55,45,0.08)]">
            <p className="text-2xl tracking-[-0.03em] text-[#16372d]">No tasks assigned yet.</p>
            <p className="mt-3 text-sm leading-7 text-[#5d736b]">When new complaints are routed to you, they will appear here with due dates, evidence upload, and resolution controls.</p>
          </section>
        ) : (
          sortedComplaints.map((complaint) => (
            <article key={complaint.complaintId} className="relative overflow-hidden rounded-[2rem] border border-[#16372d]/8 bg-[linear-gradient(180deg,#fffdf9_0%,#fff4e8_100%)] shadow-[0_18px_40px_rgba(22,55,45,0.08)]">
              <div className="absolute -right-12 top-0 h-32 w-32 rounded-full bg-[#ffd3a8]/35 blur-3xl" />
              <div className="relative grid gap-6 p-6 sm:p-7 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a45d16]">Assigned complaint</p>
                      <h2 className="mt-2 text-3xl tracking-[-0.03em] text-[#16372d]">{complaint.title}</h2>
                    </div>
                    <StatusBadge status={complaint.status} />
                  </div>

                  <p className="text-sm leading-7 text-[#587068]">{complaint.description}</p>

                  <div className="flex flex-wrap gap-3 text-xs font-medium text-[#5b7169]">
                    <span className="rounded-full bg-white px-3 py-1.5">Category: {complaint.categoryLabel}</span>
                    <span className="rounded-full bg-white px-3 py-1.5">Due: {formatDate(complaint.targetDate)}</span>
                    <span className="rounded-full bg-white px-3 py-1.5">Priority: {complaint.priority}</span>
                    {complaint.streetName && <span className="rounded-full bg-white px-3 py-1.5">Street: {complaint.streetName}</span>}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[1.35rem] border border-[#16372d]/8 bg-white/84 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7e78]">Field checklist</p>
                      <ul className="mt-3 space-y-2 text-sm leading-7 text-[#5d736b]">
                        <li>Confirm the issue on site.</li>
                        <li>Upload at least one relevant photo.</li>
                        <li>Add a concise resolution note before closing.</li>
                      </ul>
                    </div>
                    <div className="rounded-[1.35rem] border border-[#ef7a1a]/14 bg-[#fff8f0] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a45d16]">Complaint timing</p>
                      <p className="mt-3 text-sm leading-7 text-[#8b4a0d]">
                        Submitted {formatDate(complaint.createdAt)} and currently expected by {formatDate(complaint.targetDate)}.
                      </p>
                      {complaint.resolutionComment && (
                        <p className="mt-3 text-sm leading-7 text-[#8b4a0d]">
                          Latest note: {complaint.resolutionComment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-[#16372d]/8 bg-white/90 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7e78]">Action panel</p>
                  <div className="mt-4 space-y-4">
                    {complaint.status === "ASSIGNED" && (
                      <>
                        <p className="text-sm leading-7 text-[#5d736b]">Start the task when you are ready to move this complaint into active field work.</p>
                        <button
                          type="button"
                          onClick={() => updateStatus(complaint.complaintId, "IN_PROGRESS")}
                          disabled={savingComplaintId === complaint.complaintId}
                          className="civic-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingComplaintId === complaint.complaintId ? "Starting..." : "Start work"}
                        </button>
                      </>
                    )}

                    {complaint.status === "IN_PROGRESS" && (
                      <>
                        <div className="rounded-[1.35rem] border border-[#16372d]/8 bg-[#f6efe3] p-4">
                          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7e78]" htmlFor={`agent-upload-${complaint.complaintId}`}>
                            Field evidence
                          </label>
                          <input
                            id={`agent-upload-${complaint.complaintId}`}
                            type="file"
                            accept="image/*"
                            className="mt-3 text-xs"
                            aria-label={`Select a complaint photo for ${complaint.title}`}
                            onChange={(event) => setSelectedFileByComplaintId({
                              ...selectedFileByComplaintId,
                              [complaint.complaintId]: event.target.files[0],
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => uploadPhoto(complaint.complaintId)}
                            aria-label={`Upload the selected complaint photo for ${complaint.title}`}
                            disabled={uploadingComplaintId === complaint.complaintId}
                            className="civic-button-secondary mt-3 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {uploadingComplaintId === complaint.complaintId ? "Uploading..." : "Upload photo"}
                          </button>
                          {uploadNoticeByComplaintId[complaint.complaintId] && (
                            <p className="mt-3 text-sm text-[#8b4a0d]">{uploadNoticeByComplaintId[complaint.complaintId]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7e78]" htmlFor={`agent-resolution-${complaint.complaintId}`}>
                            Resolution note
                          </label>
                          <textarea
                            id={`agent-resolution-${complaint.complaintId}`}
                            placeholder="Explain what was fixed, inspected, or completed"
                            rows={3}
                            className="mt-3 min-h-28 w-full rounded-[1.2rem] border border-[#16372d]/10 bg-white/82 px-4 py-3 text-sm text-[#16372d] resize-none"
                            value={resolutionComment[complaint.complaintId] || ""}
                            onChange={(event) => setResolutionComment({
                              ...resolutionComment,
                              [complaint.complaintId]: event.target.value,
                            })}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => updateStatus(complaint.complaintId, "RESOLVED", resolutionComment[complaint.complaintId])}
                          disabled={savingComplaintId === complaint.complaintId}
                          className="civic-button-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingComplaintId === complaint.complaintId ? "Saving..." : "Mark as resolved"}
                        </button>
                      </>
                    )}

                    {["RESOLVED", "CLOSED"].includes(complaint.status) && (
                      <div className="rounded-[1.35rem] border border-[#1f6942]/12 bg-[#eef8f1] px-4 py-4 text-sm leading-7 text-[#1f6942]">
                        This complaint is completed. Keep the note and evidence as a clear record of the field intervention.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </main>
    </div>
  );
}