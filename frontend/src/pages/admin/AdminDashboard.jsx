import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/shared/Navbar";
import StatusBadge from "../../components/shared/StatusBadge";
import ComplaintsMap from "../../components/map/ComplaintsMap";
import api from "../../api/axios";

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [agents,     setAgents]     = useState([]);
  const [filters, setFilters] = useState({ status: "", category: "" });

  useEffect(() => {
    api.get("/complaints").then(r => setComplaints(r.data));
    api.get("/users/agents").then(r => setAgents(r.data));
  }, []);

  const assign = async (complaintId, agentId) => {
    await api.put(`/complaints/${complaintId}/assign`, { agentId: parseInt(agentId) });
    const { data } = await api.get("/complaints");
    setComplaints(data);
  };

  const filtered = complaints.filter(c =>
    (!filters.status   || c.status === filters.status) &&
    (!filters.category || c.categoryLabel === filters.category)
  );

  const categories = [...new Set(complaints.map(c => c.categoryLabel))];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={[{ to: "/admin/analytics", label: "📊 Analytics" }]} />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-800">Admin Dashboard</h2>

        {/* Map */}
        <ComplaintsMap complaints={complaints} />

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <select className="border rounded-lg px-3 py-2 text-sm"
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Statuses</option>
            {["PENDING","VALIDATED","ASSIGNED","IN_PROGRESS","RESOLVED","OVERDUE","ARCHIVED","CLOSED","REJECTED","CANCELLED"].map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm"
            value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                {["Title","Category","Status","Priority","Citizen","Assigned Agent","Target Date","Assign"].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(c => (
                <tr key={c.complaintId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-gray-500">{c.categoryLabel}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{c.priority}</td>
                  <td className="px-4 py-3 text-gray-500">{c.citizenEmail}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.assignedAgentEmail ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.targetDate}</td>
                  <td className="px-4 py-3">
                    {c.status === "PENDING" && (
                      <select
                        className="border rounded px-2 py-1 text-xs"
                        defaultValue=""
                        onChange={e => e.target.value && assign(c.complaintId, e.target.value)}
                      >
                        <option value="">Assign...</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>{a.email}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}