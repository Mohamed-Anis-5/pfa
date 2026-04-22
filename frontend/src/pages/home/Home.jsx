import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import logo from "../../assets/logo.png";
import PublicHeader from "../../components/shared/PublicHeader";
import { useAuth } from "../../context/useAuth";

const categories = [
  "Road damage and broken paving",
  "Street lighting failures",
  "Blocked drainage and sanitation issues",
  "Waste dumping and public space damage",
];

const steps = [
  {
    number: "01",
    title: "Describe the issue clearly",
    text: "Start a complaint with a clear title, category, and practical details about what needs attention.",
  },
  {
    number: "02",
    title: "Point to the exact location",
    text: "Add the place on the map so municipal teams know where to inspect and intervene.",
  },
  {
    number: "03",
    title: "Follow the status",
    text: "Track validation, assignment, work in progress, and resolution without losing context.",
  },
  {
    number: "04",
    title: "Close the feedback loop",
    text: "When work is done, residents can review the outcome and see how the complaint was handled.",
  },
];

const serviceHighlights = [
  {
    title: "For residents",
    text: "Submit complaints without navigating a dense back-office interface.",
  },
  {
    title: "For field agents",
    text: "Receive clear assignments, upload evidence, and close work with structured notes.",
  },
  {
    title: "For administrators",
    text: "Monitor the incoming flow, route complaints, and keep service quality visible.",
  },
];

const statusClasses = {
  PENDING: "border-[#d97706]/20 bg-[#fff3dd] text-[#9a5b00]",
  VALIDATED: "border-[#0f766e]/20 bg-[#e2f7f2] text-[#0f5f57]",
  ASSIGNED: "border-[#1d4ed8]/18 bg-[#e8f0ff] text-[#204a9d]",
  IN_PROGRESS: "border-[#8b5cf6]/18 bg-[#f2ebff] text-[#6741c7]",
  RESOLVED: "border-[#15803d]/18 bg-[#e7f7eb] text-[#17653a]",
  ARCHIVED: "border-[#475569]/18 bg-[#eef2f6] text-[#334155]",
  CLOSED: "border-[#166534]/18 bg-[#def3e4] text-[#14532d]",
  REJECTED: "border-[#dc2626]/18 bg-[#fde8e8] text-[#991b1b]",
  CANCELLED: "border-[#7c2d12]/18 bg-[#fff0e7] text-[#9a3412]",
};

const priorityClasses = {
  Low: "text-[#4b635b]",
  Medium: "text-[#a16207]",
  High: "text-[#b45309]",
  Emergency: "text-[#b91c1c]",
};

const fallbackSummary = {
  complaintsToday: 0,
  totalComplaints: 0,
  recentComplaints: [],
};

function getDashboardPath(role) {
  if (role === "ROLE_CITIZEN") return "/citizen";
  if (role === "ROLE_ADMIN") return "/admin";
  if (role === "ROLE_AGENT") return "/agent";
  return "/";
}

function formatCount(value) {
  return new Intl.NumberFormat("en").format(value ?? 0);
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(status) {
  return status?.replaceAll("_", " ") ?? "Unknown";
}

export default function Home() {
  const { user } = useAuth();
  const dashboardPath = getDashboardPath(user?.role);
  const [summary, setSummary] = useState(fallbackSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isActive = true;

    api.get("/complaints/public/home")
      .then(({ data }) => {
        if (!isActive) return;
        setSummary({
          complaintsToday: data?.complaintsToday ?? 0,
          totalComplaints: data?.totalComplaints ?? 0,
          recentComplaints: Array.isArray(data?.recentComplaints) ? data.recentComplaints : [],
        });
        setLoadError("");
      })
      .catch(() => {
        if (!isActive) return;
        setSummary(fallbackSummary);
        setLoadError("Live complaint data is temporarily unavailable.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const statCards = [
    {
      value: isLoading ? "..." : formatCount(summary.complaintsToday),
      label: "complaints submitted today",
      tone: "bg-[#16372d] text-[#fff6ec]",
    },
    {
      value: isLoading ? "..." : formatCount(summary.totalComplaints),
      label: "complaints recorded in total",
      tone: "bg-white text-[#16372d]",
    },
    {
      value: isLoading ? "..." : formatCount(summary.recentComplaints.length),
      label: "recent complaints highlighted below",
      tone: "bg-[#fff1e5] text-[#8b4a0d]",
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff6ef_0%,#fff2e4_35%,#f7efe5_100%)] text-[#16372d]">
      <PublicHeader />

      <main>
        <section id="service-overview" className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[40rem] bg-[radial-gradient(circle_at_top_left,_rgba(240,122,26,0.22),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(22,55,45,0.14),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.72),_rgba(255,242,228,0))]" />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-20">
            <div className="space-y-7">
              <span className="inline-flex rounded-full border border-[#f08a27]/16 bg-white/78 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#a35c18]">
                Default public home page
              </span>
              <div className="space-y-5">
                <h1 className="max-w-3xl font-serif text-5xl leading-[1.02] tracking-[-0.04em] text-[#16372d] sm:text-6xl lg:text-7xl">
                  Report local problems, follow progress, and understand the service at a glance.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[#526860] sm:text-xl">
                  This home page explains what the service does, shows the latest submitted complaints, and gives a public view of complaint activity before anyone signs in.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to={user ? dashboardPath : "/register"}
                  className="inline-flex items-center justify-center rounded-full bg-[#ef7a1a] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ef7a1a]/25 transition hover:bg-[#d86b11]"
                >
                  {user ? "Open your dashboard" : "Start a report"}
                </Link>
                {user ? (
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center rounded-full border border-[#16372d]/12 bg-white/78 px-6 py-3 text-sm font-semibold text-[#16372d] transition hover:border-[#16372d]/30 hover:bg-white"
                  >
                    See how it works
                  </a>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-full border border-[#16372d]/12 bg-white/78 px-6 py-3 text-sm font-semibold text-[#16372d] transition hover:border-[#16372d]/30 hover:bg-white"
                  >
                    Sign in to your dashboard
                  </Link>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {statCards.map((stat) => (
                  <div key={stat.label} className={`rounded-[1.75rem] border border-[#16372d]/8 p-5 shadow-[0_16px_34px_rgba(22,55,45,0.08)] backdrop-blur-sm ${stat.tone}`}>
                    <p className="text-3xl font-semibold tracking-[-0.04em]">{stat.value}</p>
                    <p className="mt-2 text-sm leading-6 opacity-80">{stat.label}</p>
                  </div>
                ))}
              </div>
              {loadError && (
                <p role="status" className="max-w-xl rounded-2xl border border-[#ef7a1a]/14 bg-white/84 px-4 py-3 text-sm text-[#8b4a0d]">
                  {loadError}
                </p>
              )}
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-[#ef7a1a]/12 bg-[linear-gradient(180deg,#fffaf4_0%,#ffe9d4_100%)] p-6 shadow-[0_26px_60px_rgba(239,122,26,0.14)] sm:p-8">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#f7c58f]/40 blur-3xl" />
              <div className="relative rounded-[1.6rem] border border-[#ef7a1a]/12 bg-white/88 p-5 shadow-[0_20px_40px_rgba(22,55,45,0.08)]">
                <div className="flex items-center gap-4">
                  <img
                    src={logo}
                    alt="Municipal Platform logo"
                    className="h-24 w-24 rounded-[1.5rem] border border-[#ef7a1a]/12 bg-[#fff7ef] object-cover p-2 shadow-[0_14px_28px_rgba(239,122,26,0.12)]"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b5651d]">Service overview</p>
                    <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#16372d]">Built for public visibility and faster action</h2>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {serviceHighlights.map((item) => (
                  <article key={item.title} className="rounded-[1.45rem] border border-[#16372d]/8 bg-white/84 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a35c18]">{item.title}</p>
                    <p className="mt-3 text-sm leading-7 text-[#506760]">{item.text}</p>
                  </article>
                ))}
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#ef7a1a]/18 bg-[#fff7ef] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a35c18]">What you can report</p>
                <div className="mt-4 space-y-3">
                  {categories.map((category) => (
                    <div key={category} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-[#314840] shadow-sm">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#ef7a1a]" />
                      <span>{category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="recent-complaints" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a35c18]">Recent submitted complaints</p>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-[#16372d]">Latest reports visible from the public home page.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#60756d]">
              This section gives visitors immediate context on the kinds of issues being submitted and how each complaint is progressing.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {summary.recentComplaints.length === 0 ? (
              <article className="rounded-[1.8rem] border border-[#16372d]/8 bg-white/82 p-6 shadow-[0_18px_36px_rgba(22,55,45,0.08)] lg:col-span-2 xl:col-span-3">
                <p className="text-sm leading-7 text-[#5d736c]">
                  {isLoading ? "Loading recent complaints..." : "No public complaints are available yet."}
                </p>
              </article>
            ) : summary.recentComplaints.map((complaint) => (
              <article key={complaint.complaintId} className="rounded-[1.8rem] border border-[#16372d]/8 bg-white/82 p-6 shadow-[0_18px_36px_rgba(22,55,45,0.08)]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] ${statusClasses[complaint.status] ?? "border-[#16372d]/10 bg-[#f6efe3] text-[#16372d]"}`}>
                    {formatStatus(complaint.status)}
                  </span>
                  <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${priorityClasses[complaint.priority] ?? "text-[#5d736c]"}`}>
                    {complaint.priority} priority
                  </span>
                </div>
                <h3 className="mt-4 font-serif text-2xl tracking-[-0.03em] text-[#16372d]">{complaint.title}</h3>
                <p className="mt-3 text-sm font-medium text-[#a35c18]">{complaint.categoryLabel}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#5d736c]">
                  <span className="rounded-full bg-[#fff3e8] px-3 py-1.5">Submitted {formatDate(complaint.createdAt)}</span>
                  <span className="rounded-full bg-[#f6efe3] px-3 py-1.5">Target date {formatDate(complaint.targetDate)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="service-stats" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="rounded-[2rem] bg-[#16372d] px-6 py-8 text-[#f7f2e8] shadow-[0_30px_70px_rgba(22,55,45,0.18)] sm:px-8 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f2c69c]">Service activity</p>
                <h2 className="mt-3 font-serif text-4xl tracking-[-0.04em]">Public complaint stats should be visible before sign-in.</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4 text-sm leading-7 text-[#dfe7e3]">
                  <span className="block text-[2rem] font-semibold tracking-[-0.04em] text-white">{isLoading ? "..." : formatCount(summary.complaintsToday)}</span>
                  New complaints submitted today.
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4 text-sm leading-7 text-[#dfe7e3]">
                  <span className="block text-[2rem] font-semibold tracking-[-0.04em] text-white">{isLoading ? "..." : formatCount(summary.totalComplaints)}</span>
                  Complaints recorded across the service.
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4 text-sm leading-7 text-[#dfe7e3]">
                  <span className="block text-[2rem] font-semibold tracking-[-0.04em] text-white">3</span>
                  Main actions: submit, follow, resolve.
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4 text-sm leading-7 text-[#dfe7e3]">
                  <span className="block text-[2rem] font-semibold tracking-[-0.04em] text-white">Live</span>
                  Statuses update as complaints move through the workflow.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-8 pb-16 sm:px-6 lg:px-8 lg:py-12 lg:pb-24">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a35c18]">How to use the service</p>
              <h2 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-[#16372d]">A clear complaint journey from report to resolution.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[#60756d]">
              The homepage explains the process before account creation so residents know exactly what happens after they submit a complaint.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step) => (
              <article key={step.number} className="rounded-[1.75rem] border border-[#16372d]/8 bg-white/78 p-6 shadow-[0_16px_34px_rgba(22,55,45,0.08)] backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#ef7a1a]">{step.number}</p>
                <h3 className="mt-4 font-serif text-2xl tracking-[-0.03em] text-[#16372d]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5f746d]">{step.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}