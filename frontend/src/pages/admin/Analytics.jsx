import { useEffect, useState } from "react";
import Navbar from "../../components/shared/Navbar";
import api from "../../api/axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#3B82F6","#F59E0B","#10B981","#EF4444","#8B5CF6","#6B7280"];

export default function Analytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/stats").then(r => setStats(r.data));
  }, []);

  if (!stats) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading analytics...</p>
    </div>
  );

  const statusData   = stats.countByStatus.map(s   => ({ name: s.status,   value: Number(s.total) }));
  const categoryData = stats.countByCategory.map(c => ({ name: c.category, value: Number(c.total) }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={[{ to: "/admin", label: "← Dashboard" }]} />
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <h2 className="text-xl font-bold text-gray-800">Analytics</h2>

        {/* KPI card */}
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-sm text-gray-500">Average Resolution Time</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">
            {stats.averageResolutionTimeHours
              ? `${stats.averageResolutionTimeHours.toFixed(1)} hrs`
              : "N/A"}
          </p>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Complaints by Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} label>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}