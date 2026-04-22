import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import logo from "../../assets/logo.png";

const PUBLIC_LINKS = [
  { href: "#service-overview", label: "Overview" },
  { href: "#recent-complaints", label: "Recent Complaints" },
  { href: "#how-it-works", label: "How To Use It" },
];

function getDashboardPath(role) {
  if (role === "ROLE_CITIZEN") return "/citizen";
  if (role === "ROLE_ADMIN") return "/admin";
  if (role === "ROLE_AGENT") return "/agent";
  return "/login";
}

export default function PublicHeader() {
  const { user } = useAuth();
  const dashboardPath = getDashboardPath(user?.role);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[#f7f2e8]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-3 text-[#16372d]">
          <img
            src={logo}
            alt="Municipal Platform logo"
            className="h-12 w-12 rounded-2xl border border-[#f08a27]/18 bg-white object-cover shadow-lg shadow-[#f08a27]/10"
          />
          <span>
            <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#b5651d]">
              Public service platform
            </span>
            <span className="block text-base font-semibold sm:text-lg">Municipal Platform</span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {PUBLIC_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#5d6758] transition hover:bg-white hover:text-[#16372d]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Link
              to={dashboardPath}
              className="rounded-full bg-[#16372d] px-4 py-2 text-sm font-semibold text-[#fff8ef] shadow-lg shadow-[#16372d]/20 transition hover:bg-[#0f4f41]"
            >
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-[#16372d]/12 px-4 py-2 text-sm font-semibold text-[#16372d] transition hover:border-[#16372d]/30 hover:bg-white"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-[#ef7a1a] px-4 py-2 text-sm font-semibold !text-white visited:!text-white hover:!text-white shadow-lg shadow-[#ef7a1a]/20 transition hover:bg-[#d86b11]"
                style={{ color: "#ffffff" }}
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}