import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/shared/Navbar";
import StatusBadge from "../../components/shared/StatusBadge";
import ComplaintsMap from "../../components/map/ComplaintsMap";
import api from "../../api/axios";

const STATUS_OPTIONS = [
  "PENDING",
  "VALIDATED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "ARCHIVED",
  "CLOSED",
  "REJECTED",
  "CANCELLED",
];

function formatStatus(status) {
  return status?.replaceAll("_", " ") ?? "Unknown";
}

function formatDate(value) {
  if (!value) return "No target date";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getPriorityTone(priority) {
  if (priority === "Emergency") return "text-[#a61b1b]";
  if (priority === "High") return "text-[#c0620d]";
  if (priority === "Medium") return "text-[#9a6b12]";
  return "text-[#5d736b]";
}

function getQueueRank(status) {
  const rankByStatus = {
    PENDING: 0,
    VALIDATED: 1,
    ASSIGNED: 2,
    IN_PROGRESS: 3,
    RESOLVED: 4,
    CLOSED: 5,
    ARCHIVED: 6,
    REJECTED: 7,
    CANCELLED: 8,
  };

  return rankByStatus[status] ?? 99;
}

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({ status: "", category: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [assigningComplaintId, setAssigningComplaintId] = useState(null);

  const applyDashboardData = (complaintsData, agentsData) => {
    setComplaints(Array.isArray(complaintsData) ? complaintsData : []);
    setAgents(Array.isArray(agentsData) ? agentsData : []);
  };

  const reloadDashboard = async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true);
    }

    try {
      const [complaintsResponse, agentsResponse] = await Promise.all([
        api.get("/complaints"),
        api.get("/users/agents"),
      ]);

      applyDashboardData(complaintsResponse.data, agentsResponse.data);
      setLoadError("");
    } catch {
      setLoadError("Unable to load the operations dashboard right now.");
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadInitialDashboard = async () => {
      try {
        const [complaintsResponse, agentsResponse] = await Promise.all([
          api.get("/complaints"),
          api.get("/users/agents"),
        ]);

        if (!isActive) {
          return;
        }

        applyDashboardData(complaintsResponse.data, agentsResponse.data);
        setLoadError("");
      } catch {
        if (isActive) {
          setLoadError("Unable to load the operations dashboard right now.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadInitialDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  const assignComplaint = async (complaintId, agentId) => {
    setAssigningComplaintId(complaintId);
    setLoadError("");

    try {
      await api.put(`/complaints/${complaintId}/assign`, { agentId: parseInt(agentId, 10) });
      await reloadDashboard(false);
    } catch {
      setLoadError("Unable to assign that complaint right now.");
    } finally {
      setAssigningComplaintId(null);
    }
  };

  const filteredComplaints = complaints.filter((complaint) =>
    (!filters.status || complaint.status === filters.status) &&
    (!filters.category || complaint.categoryLabel === filters.category)
  );

  const sortedComplaints = [...filteredComplaints].sort((leftComplaint, rightComplaint) => {
    const statusRankDifference = getQueueRank(leftComplaint.status) - getQueueRank(rightComplaint.status);
    if (statusRankDifference !== 0) {
      return statusRankDifference;
    }

    return String(leftComplaint.targetDate ?? "").localeCompare(String(rightComplaint.targetDate ?? ""));
  });

  const categories = [...new Set(complaints.map((complaint) => complaint.categoryLabel))];
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === "PENDING").length;
  const activeCount = complaints.filter((complaint) => ["ASSIGNED", "IN_PROGRESS"].includes(complaint.status)).length;
  const resolvedCount = complaints.filter((complaint) => ["RESOLVED", "CLOSED"].includes(complaint.status)).length;
  const readyToAssignCount = complaints.filter((complaint) => ["PENDING", "VALIDATED"].includes(complaint.status) && !complaint.assignedAgentEmail).length;
  const leadingCategory = complaints.length > 0
    ? Object.entries(
        complaints.reduce((categoryCounts, complaint) => {
          categoryCounts[complaint.categoryLabel] = (categoryCounts[complaint.categoryLabel] ?? 0) + 1;
          return categoryCounts;
        }, {})
      ).sort((leftEntry, rightEntry) => rightEntry[1] - leftEntry[1])[0]?.[0]
    : "No complaint categories yet";

  const renderAssignmentControl = (complaint) => {
    const canAssign = ["PENDING", "VALIDATED"].includes(complaint.status);

    if (!canAssign) {
      return (
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6e827b]">
          {complaint.assignedAgentEmail ? "Assigned" : "No action"}
        </span>
      );
    }

    if (agents.length === 0) {
      return <span className="text-sm text-[#8a5a2c]">No agents available</span>;
    }

    return (
      <div className="civic-field max-w-xs">
        <select
          aria-label={`Assign complaint ${complaint.title} to an agent`}
          defaultValue=""
          disabled={assigningComplaintId === complaint.complaintId}
          onChange={(event) => {
            if (event.target.value) {
              assignComplaint(complaint.complaintId, event.target.value);
            }
          }}
        >
          <option value="">{assigningComplaintId === complaint.complaintId ? "Assigning..." : "Assign complaint"}</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>{agent.email}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="civic-internal-page">
      <Navbar links={[{ to: "/admin/analytics", label: "Analytics" }]} />
      <main className="civic-internal-main space-y-8">
        <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-[#ef7a1a]/14 bg-[linear-gradient(180deg,#fff9f2_0%,#ffe9d3_100%)] shadow-[0_26px_60px_rgba(239,122,26,0.12)]">
            <div className="absolute -left-16 top-8 h-36 w-36 rounded-full bg-[#ffd3a8]/40 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#16372d]/10 blur-3xl" />
            <div className="relative px-6 py-7 sm:px-8">
              <p className="civic-kicker !text-[#a45d16]">Operations command</p>
              <h1 className="mt-3 text-5xl leading-[1.02] tracking-[-0.05em] text-[#16372d] sm:text-6xl">
                Coordinate complaint flow with a clearer admin control room.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#5f746d]">
                Review incoming work, spot what is waiting for assignment, and keep the complaint queue moving with faster operational context.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/admin/analytics"
                  className="inline-flex items-center justify-center rounded-full bg-[#ef7a1a] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ef7a1a]/20 transition hover:bg-[#d86b11]"
                >
                  Open analytics
                </Link>
                <a
                  href="#admin-queue"
                  className="inline-flex items-center justify-center rounded-full border border-[#16372d]/10 bg-white/78 px-5 py-3 text-sm font-semibold text-[#16372d] transition hover:bg-white"
                >
                  Jump to queue
                </a>
              </div>

              {loadError && (
                <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[1.4rem] border border-[#ef7a1a]/14 bg-white/84 px-4 py-3 text-sm text-[#8b4a0d]">
                  <span>{loadError}</span>
                  <button
                    type="button"
                    onClick={() => reloadDashboard()}
                    className="rounded-full border border-[#ef7a1a]/18 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#a45d16] transition hover:bg-white"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-[1.75rem] bg-[#16372d] px-6 py-6 text-[#f7f2e8] shadow-[0_20px_42px_rgba(22,55,45,0.18)]">
              <p className="civic-kicker !text-[#cfddd8]">Pending review</p>
              <p className="mt-2 text-5xl font-semibold tracking-[-0.05em]">{pendingCount}</p>
              <p className="mt-3 text-sm leading-7 text-[#d4e0dd]">New complaints waiting for validation or assignment attention.</p>
            </article>
            <article className="rounded-[1.75rem] border border-[#16372d]/8 bg-white/88 px-6 py-6 shadow-[0_18px_38px_rgba(22,55,45,0.08)]">
              <p className="civic-kicker !text-[#a45d16]">Active work</p>
              <p className="mt-2 text-5xl font-semibold tracking-[-0.05em] text-[#16372d]">{activeCount}</p>
              <p className="mt-3 text-sm leading-7 text-[#5f746d]">Complaints currently assigned or in progress.</p>
            </article>
            <article className="rounded-[1.75rem] border border-[#ef7a1a]/14 bg-[#fff4e8] px-6 py-6 shadow-[0_18px_38px_rgba(239,122,26,0.1)]">
              <p className="civic-kicker !text-[#a45d16]">Ready to assign</p>
              <p className="mt-2 text-5xl font-semibold tracking-[-0.05em] text-[#8b4a0d]">{readyToAssignCount}</p>
              <p className="mt-3 text-sm leading-7 text-[#8b4a0d]">Complaints that can move directly to an agent.</p>
            </article>
            <article className="rounded-[1.75rem] border border-[#16372d]/8 bg-[#f7f1e7] px-6 py-6 shadow-[0_18px_38px_rgba(22,55,45,0.08)]">
              <p className="civic-kicker">Resolved flow</p>
              <p className="mt-2 text-5xl font-semibold tracking-[-0.05em] text-[#16372d]">{resolvedCount}</p>
              <p className="mt-3 text-sm leading-7 text-[#5f746d]">Completed complaints and closed service outcomes.</p>
            </article>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
          <article className="rounded-[1.9rem] border border-[#16372d]/8 bg-white/84 px-6 py-6 shadow-[0_18px_40px_rgba(22,55,45,0.08)]">
            <p className="civic-kicker">Queue summary</p>
            <h2 className="mt-2 text-3xl tracking-[-0.03em] text-[#16372d]">What needs attention first</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.3rem] bg-[#fff4e8] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a45d16]">Total complaints</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#16372d]">{totalCount}</p>
              </div>
              <div className="rounded-[1.3rem] bg-[#eef6f2] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#275b4b]">Agents available</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#16372d]">{agents.length}</p>
              </div>
              <div className="rounded-[1.3rem] bg-[#f5efe5] px-4 py-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6c8179]">Most reported category</p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#16372d]">{leadingCategory}</p>
              </div>
            </div>
          </article>

          <ComplaintsMap complaints={complaints} />
        </section>

        {isLoading ? (
          <section className="rounded-[1.9rem] border border-[#16372d]/8 bg-white/84 px-6 py-12 text-center text-[#5f746d] shadow-[0_18px_40px_rgba(22,55,45,0.08)]">
            Loading complaint queue...
          </section>
        ) : (
          <>
            <section className="rounded-[1.9rem] border border-[#16372d]/8 bg-white/84 px-6 py-6 shadow-[0_18px_40px_rgba(22,55,45,0.08)] sm:px-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="civic-kicker">Queue controls</p>
                  <h2 className="mt-2 text-3xl tracking-[-0.03em] text-[#16372d]">Refine the operational queue</h2>
                  <p className="mt-3 text-sm leading-7 text-[#5f746d]">
                    {sortedComplaints.length} complaint{sortedComplaints.length === 1 ? "" : "s"} currently match the selected filters.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="civic-field min-w-52">
                    <label htmlFor="admin-status-filter" className="sr-only">Filter complaints by status</label>
                    <select
                      id="admin-status-filter"
                      aria-label="Filter complaints by status"
                      value={filters.status}
                      onChange={(event) => setFilters({ ...filters, status: event.target.value })}
                    >
                      <option value="">All statuses</option>
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{formatStatus(status)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="civic-field min-w-52">
                    <label htmlFor="admin-category-filter" className="sr-only">Filter complaints by category</label>
                    <select
                      id="admin-category-filter"
                      aria-label="Filter complaints by category"
                      value={filters.category}
                      onChange={(event) => setFilters({ ...filters, category: event.target.value })}
                    >
                      <option value="">All categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section id="admin-queue" aria-labelledby="complaints-table-heading" className="overflow-hidden rounded-[1.95rem] border border-[#16372d]/8 bg-white/86 shadow-[0_18px_40px_rgba(22,55,45,0.08)]">
              <div className="border-b border-[#16372d]/8 px-6 py-5 sm:px-8">
                <p className="civic-kicker">Operations queue</p>
                <h2 id="complaints-table-heading" className="mt-2 text-3xl tracking-[-0.03em] text-[#16372d]">Assign and monitor complaints with less friction</h2>
              </div>

              {sortedComplaints.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-[#5f746d] sm:px-8">
                  No complaints match the selected filters.
                </div>
              ) : (
                <>
                  <div className="grid gap-4 p-6 lg:hidden">
                    {sortedComplaints.map((complaint) => (
                      <article key={complaint.complaintId} className="rounded-[1.5rem] border border-[#16372d]/8 bg-[#fffaf4] p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a45d16]">{complaint.categoryLabel}</p>
                            <h3 className="mt-2 text-2xl tracking-[-0.03em] text-[#16372d]">{complaint.title}</h3>
                          </div>
                          <StatusBadge status={complaint.status} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                          <span className={`rounded-full bg-white px-3 py-1.5 ${getPriorityTone(complaint.priority)}`}>
                            {complaint.priority} priority
                          </span>
                          <span className="rounded-full bg-white px-3 py-1.5 text-[#5f746d]">
                            Due {formatDate(complaint.targetDate)}
                          </span>
                          {complaint.streetName && (
                            <span className="rounded-full bg-white px-3 py-1.5 text-[#5f746d]">
                              {complaint.streetName}
                            </span>
                          )}
                        </div>
                        <dl className="mt-4 grid gap-3 text-sm text-[#5f746d]">
                          <div>
                            <dt className="font-semibold text-[#16372d]">Citizen</dt>
                            <dd>{complaint.citizenEmail}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-[#16372d]">Assigned agent</dt>
                            <dd>{complaint.assignedAgentEmail ?? "Not assigned yet"}</dd>
                          </div>
                        </dl>
                        <div className="mt-5">{renderAssignmentControl(complaint)}</div>
                      </article>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto lg:block">
                    <table className="min-w-[920px] w-full text-sm">
                      <caption className="sr-only">Complaints with status, assignment, and due date details</caption>
                      <thead className="bg-[#f7efe4] text-[#5f746d] uppercase text-[0.72rem] tracking-[0.18em]">
                        <tr>
                          {["Title", "Category", "Status", "Priority", "Citizen", "Assigned Agent", "Target Date", "Action"].map((heading) => (
                            <th key={heading} scope="col" className="px-6 py-4 text-left">{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#16372d]/8">
                        {sortedComplaints.map((complaint) => (
                          <tr key={complaint.complaintId} className="transition hover:bg-[#fffaf4]">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-semibold text-[#16372d]">{complaint.title}</p>
                                <p className="mt-1 text-xs text-[#6e827b]">{formatStatus(complaint.status)}</p>
                                {complaint.streetName && <p className="mt-1 text-xs text-[#6e827b]">{complaint.streetName}</p>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[#5f746d]">{complaint.categoryLabel}</td>
                            <td className="px-6 py-4"><StatusBadge status={complaint.status} /></td>
                            <td className={`px-6 py-4 font-semibold ${getPriorityTone(complaint.priority)}`}>{complaint.priority}</td>
                            <td className="px-6 py-4 text-[#5f746d]">{complaint.citizenEmail}</td>
                            <td className="px-6 py-4 text-[#5f746d]">{complaint.assignedAgentEmail ?? "Not assigned"}</td>
                            <td className="px-6 py-4 text-[#5f746d]">{formatDate(complaint.targetDate)}</td>
                            <td className="px-6 py-4">{renderAssignmentControl(complaint)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}