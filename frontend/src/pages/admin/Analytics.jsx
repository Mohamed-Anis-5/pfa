import { useEffect, useState } from "react";
import Navbar from "../../components/shared/Navbar";
import api from "../../api/axios";
import {
  BarChart, Bar, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";

const COLORS = ["#ef7a1a", "#0f4f41", "#d7a634", "#c75d2c", "#5b8b80", "#6d67d8"];

function formatLabel(value) {
  return value?.replaceAll("_", " ") ?? "Unknown";
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const reloadStats = async () => {
    setIsLoading(true);

    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data);
      setLoadError("");
    } catch {
      setLoadError("Unable to load analytics right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadInitialStats = async () => {
      try {
        const response = await api.get("/dashboard/stats");
        if (!isActive) {
          return;
        }
        setStats(response.data);
        setLoadError("");
      } catch {
        if (isActive) {
          setLoadError("Unable to load analytics right now.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadInitialStats();

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="civic-internal-page flex items-center justify-center">
        <div className="civic-panel rounded-[1.75rem] px-6 py-6 text-[#5d736b]">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="civic-internal-page">
        <Navbar links={[{ to: "/admin", label: "Dashboard" }]} />
        <main className="civic-internal-main">
          <section className="rounded-[1.9rem] border border-[#ef7a1a]/14 bg-white/88 px-6 py-10 text-center shadow-[0_18px_40px_rgba(22,55,45,0.08)]">
            <p className="text-sm text-[#8b4a0d]">{loadError || "Analytics are not available."}</p>
            <button
              type="button"
              onClick={() => reloadStats()}
              className="mt-4 rounded-full bg-[#16372d] px-5 py-3 text-sm font-semibold text-[#fff7ef] transition hover:bg-[#0f4f41]"
            >
              Retry analytics
            </button>
          </section>
        </main>
      </div>
    );
  }

  const statusData = (stats.countByStatus ?? []).map((statusEntry) => ({
    name: statusEntry.status,
    value: Number(statusEntry.total),
  }));
  const categoryData = (stats.countByCategory ?? []).map((categoryEntry) => ({
    name: categoryEntry.category,
    value: Number(categoryEntry.total),
  }));
  const totalComplaints = statusData.reduce((sum, entry) => sum + entry.value, 0);
  const leadingStatus = [...statusData].sort((leftEntry, rightEntry) => rightEntry.value - leftEntry.value)[0];
  const leadingCategory = [...categoryData].sort((leftEntry, rightEntry) => rightEntry.value - leftEntry.value)[0];
  const resolvedEntry = statusData.find((entry) => entry.name === "RESOLVED" || entry.name === "CLOSED");
  const resolvedShare = totalComplaints > 0
    ? Math.round(((resolvedEntry?.value ?? 0) / totalComplaints) * 100)
    : 0;

  return (
    <div className="civic-internal-page">
      <Navbar links={[{ to: "/admin", label: "Dashboard" }]} />
      <main className="civic-internal-main space-y-8">
        <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <div className="relative overflow-hidden rounded-[2.2rem] border border-[#ef7a1a]/14 bg-[linear-gradient(180deg,#fff9f3_0%,#ffe8d2_100%)] shadow-[0_24px_58px_rgba(239,122,26,0.12)]">
            <div className="absolute -left-10 top-8 h-36 w-36 rounded-full bg-[#ffd3a8]/40 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#16372d]/10 blur-3xl" />
            <div className="relative px-6 py-7 sm:px-8">
              <p className="civic-kicker !text-[#a45d16]">Performance view</p>
              <h1 className="mt-3 text-5xl leading-[1.03] tracking-[-0.05em] text-[#16372d] sm:text-6xl">
                Read service performance like an operations report, not a raw dashboard dump.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#5d736b]">
                Review complaint distribution, spot the dominant category, and understand how quickly reports move to resolution.
              </p>
              {loadError && (
                <p className="mt-5 rounded-[1.35rem] border border-[#ef7a1a]/14 bg-white/84 px-4 py-3 text-sm text-[#8b4a0d]">
                  {loadError}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-[1.8rem] bg-[#16372d] px-6 py-6 text-[#f7f2e8] shadow-[0_20px_42px_rgba(22,55,45,0.18)]">
              <p className="civic-kicker !text-[#cfddd8]">Average resolution time</p>
              <p className="mt-3 text-6xl font-semibold tracking-[-0.06em]">
                {stats.averageResolutionTimeHours
                  ? `${stats.averageResolutionTimeHours.toFixed(1)}h`
                  : "N/A"}
              </p>
              <p className="mt-4 text-sm leading-7 text-[#d5e2de]">Average time from report creation to resolution.</p>
            </article>
            <article className="rounded-[1.8rem] border border-[#ef7a1a]/14 bg-[#fff4e8] px-6 py-6 shadow-[0_18px_38px_rgba(239,122,26,0.1)]">
              <p className="civic-kicker !text-[#a45d16]">Resolved share</p>
              <p className="mt-3 text-6xl font-semibold tracking-[-0.06em] text-[#8b4a0d]">{resolvedShare}%</p>
              <p className="mt-4 text-sm leading-7 text-[#8b4a0d]">Share of complaints currently in resolved or closed states.</p>
            </article>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.65rem] border border-[#16372d]/8 bg-white/86 px-6 py-5 shadow-[0_18px_38px_rgba(22,55,45,0.08)]">
            <p className="civic-kicker">Total complaints</p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#16372d]">{totalComplaints}</p>
            <p className="mt-2 text-sm leading-7 text-[#5d736b]">All complaints currently reflected in the analytics snapshot.</p>
          </article>
          <article className="rounded-[1.65rem] border border-[#16372d]/8 bg-white/86 px-6 py-5 shadow-[0_18px_38px_rgba(22,55,45,0.08)]">
            <p className="civic-kicker">Dominant status</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#16372d]">{formatLabel(leadingStatus?.name)}</p>
            <p className="mt-2 text-sm leading-7 text-[#5d736b]">{leadingStatus?.value ?? 0} complaints currently sit in this status.</p>
          </article>
          <article className="rounded-[1.65rem] border border-[#16372d]/8 bg-white/86 px-6 py-5 shadow-[0_18px_38px_rgba(22,55,45,0.08)]">
            <p className="civic-kicker">Top category</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#16372d]">{leadingCategory?.name ?? "No category data"}</p>
            <p className="mt-2 text-sm leading-7 text-[#5d736b]">{leadingCategory?.value ?? 0} complaints belong to this category.</p>
          </article>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-[1.9rem] border border-[#16372d]/8 bg-white/86 p-6 shadow-[0_18px_40px_rgba(22,55,45,0.08)] sm:p-7">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="civic-kicker">Workload</p>
                <h2 className="mt-2 text-3xl tracking-[-0.03em] text-[#16372d]">Complaints by status</h2>
              </div>
              <p className="max-w-xs text-sm leading-7 text-[#5d736b]">Quickly identify where the queue is getting heavier.</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData}>
                <CartesianGrid stroke="#efe7da" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#60756d" }} tickFormatter={formatLabel} />
                <YAxis tick={{ fill: "#60756d" }} />
                <Tooltip />
                <Bar dataKey="value" fill="#ef7a1a" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="rounded-[1.9rem] border border-[#16372d]/8 bg-white/86 p-6 shadow-[0_18px_40px_rgba(22,55,45,0.08)] sm:p-7">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="civic-kicker">Breakdown</p>
                <h2 className="mt-2 text-3xl tracking-[-0.03em] text-[#16372d]">Complaints by category</h2>
              </div>
              <p className="max-w-xs text-sm leading-7 text-[#5d736b]">See which issue types dominate the incoming queue.</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={48} outerRadius={84}>
                  {categoryData.map((categoryEntry, index) => (
                    <Cell key={categoryEntry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend formatter={formatLabel} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </section>
        </div>
      </main>
    </div>
  );
}