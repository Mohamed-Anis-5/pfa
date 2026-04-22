import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useState, useEffect, useId } from "react";
import api from "../../api/axios";
import logo from "../../assets/logo.png";

export default function Navbar({ links = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsPanelId = useId();
  const homePath = user?.role === "ROLE_ADMIN"
    ? "/admin"
    : user?.role === "ROLE_AGENT"
      ? "/agent"
      : "/citizen";

  useEffect(() => {
    if (!user) return;
    const fetch = () =>
      api.get("/notifications/my")
        .then(r => setNotifications(r.data))
        .catch(() => {});
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!showNotifications) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showNotifications]);

  const markAllRead = async () => {
    await Promise.all(notifications.map(n => api.put(`/notifications/${n.id}/read`)));
    setNotifications([]);
    setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-30 border-b border-[#16372d]/8 bg-[#f7f2e8]/92 backdrop-blur-xl">
      <div className="civic-shell flex flex-col gap-3 px-0 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          <Link to={homePath} className="inline-flex items-center gap-3 text-[#16372d]">
            <img
              src={logo}
              alt="Municipal Platform logo"
              className="h-12 w-12 rounded-2xl border border-[#f08a27]/18 bg-white object-cover shadow-lg shadow-[#f08a27]/10"
            />
            <span>
              <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[#6b7e78]">
                Service dashboard
              </span>
              <span className="block text-base font-semibold sm:text-lg">Municipal Platform</span>
            </span>
          </Link>

          {links.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {links.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="rounded-full border border-[#16372d]/10 bg-white/70 px-4 py-2 text-sm font-medium text-[#325148] transition hover:border-[#16372d]/24 hover:bg-white hover:text-[#16372d]"
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(s => !s)}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#16372d]/10 bg-white/76 text-lg text-[#16372d] transition hover:border-[#16372d]/24 hover:bg-white"
                type="button"
                title="Notifications"
                aria-label={notifications.length > 0
                  ? `Notifications, ${notifications.length} unread`
                  : "Notifications"}
                aria-expanded={showNotifications}
                aria-haspopup="dialog"
                aria-controls={notificationsPanelId}
              >
                <span aria-hidden="true">🔔</span>
                {notifications.length > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute right-0 top-0 inline-flex min-h-5 min-w-5 -translate-y-1/3 translate-x-1/4 items-center justify-center rounded-full bg-[#b54735] px-1.5 text-[0.65rem] font-bold text-white"
                  >
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div
                  id={notificationsPanelId}
                  role="dialog"
                  aria-label="Notifications panel"
                  className="absolute right-0 top-14 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.4rem] border border-[#16372d]/10 bg-white/96 text-gray-800 shadow-[0_24px_55px_rgba(22,55,45,0.16)] backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between border-b border-[#16372d]/8 px-4 py-3">
                    <span className="text-sm font-semibold text-[#16372d]">Notifications</span>
                    {notifications.length > 0 && (
                      <button type="button" onClick={markAllRead} className="text-xs font-semibold text-[#0f4f41] hover:text-[#16372d]">
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p role="status" className="px-4 py-6 text-sm text-[#60756d]">No new notifications.</p>
                  ) : (
                    <ul className="max-h-64 overflow-y-auto divide-y divide-[#16372d]/8">
                      {notifications.map(n => (
                        <li key={n.id} className="px-4 py-3 transition hover:bg-[#f6efe3]">
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#0f4f41]">
                            {n.eventType.replace(/_/g, " ")}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[#4d635c]">{n.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="rounded-full border border-[#16372d]/8 bg-white/70 px-4 py-2 text-sm font-medium text-[#48625a]">
            {user?.email}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-[#16372d] px-4 py-2 text-sm font-semibold text-[#f7f2e8] shadow-lg shadow-[#16372d]/18 transition hover:bg-[#0f4f41]"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}