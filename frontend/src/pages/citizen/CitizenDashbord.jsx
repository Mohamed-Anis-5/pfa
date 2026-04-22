import { Link } from "react-router-dom";
import Navbar from "../../components/shared/Navbar";
import { useAuth } from "../../context/useAuth";

export default function CitizenDashboard() {
  const { user } = useAuth();

  return (
    <div className="civic-internal-page">
      <Navbar links={[
        { to: "/citizen/complaints", label: "My Complaints" },
        { to: "/citizen/submit",     label: "New Complaint" },
      ]} />
      <main className="civic-internal-main space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="civic-panel rounded-[2rem] px-6 py-7 sm:px-8 sm:py-8">
            <p className="civic-kicker">Citizen dashboard</p>
            <h1 className="mt-3 max-w-2xl text-5xl leading-[1.03] tracking-[-0.05em] text-[#16372d] sm:text-6xl">
              Report problems clearly and keep every update visible.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#5d736b] sm:text-lg">
              Welcome back, {user?.email}. Use the platform to submit a new issue, monitor ongoing complaints, and review resolutions in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/citizen/submit" className="civic-button-primary">
                Start a new complaint
              </Link>
              <Link to="/citizen/complaints" className="civic-button-secondary">
                View my reports
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#16372d] px-6 py-7 text-[#f7f2e8] shadow-[0_24px_55px_rgba(22,55,45,0.18)] sm:px-8">
            <p className="civic-kicker !text-[#c7d7d0]">Your reporting flow</p>
            <div className="mt-5 space-y-4">
              {[
                "Describe the issue with a clear title and category.",
                "Attach the location so the right team can reach it fast.",
                "Track validation, assignment, and resolution from your account.",
              ].map((item) => (
                <div key={item} className="rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-4 text-sm leading-7 text-[#d7e2dd]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <Link
            to="/citizen/submit"
            className="rounded-[1.75rem] border border-[#16372d]/10 bg-[linear-gradient(135deg,#16372d,#0f4f41)] px-6 py-7 text-[#f7f2e8] shadow-[0_20px_42px_rgba(22,55,45,0.18)] transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c7d7d0]">Primary action</p>
            <h2 className="mt-3 text-3xl tracking-[-0.03em]">Submit a complaint</h2>
            <p className="mt-3 text-sm leading-7 text-[#d9e3df]">
              Report a local issue with location, category, and supporting photo evidence.
            </p>
          </Link>

          <Link
            to="/citizen/complaints"
            className="civic-panel rounded-[1.75rem] px-6 py-7 transition hover:-translate-y-0.5"
          >
            <p className="civic-kicker">Tracking</p>
            <h2 className="mt-3 text-3xl tracking-[-0.03em] text-[#16372d]">Follow my complaints</h2>
            <p className="mt-3 text-sm leading-7 text-[#5d736b]">
              Review statuses, assigned teams, due dates, and completed resolutions without leaving the dashboard.
            </p>
          </Link>
        </section>
      </main>
    </div>
  );
}