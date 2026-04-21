import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useState, useEffect } from "react";
import api from "../../api/axios";

export default function Navbar({ links = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  const markAllRead = async () => {
    await Promise.all(notifications.map(n => api.put(`/notifications/${n.id}/read`)));
    setNotifications([]);
    setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow">
      <span className="font-bold text-lg">🏛 Municipal Platform</span>
      <div className="flex items-center gap-4 text-sm">
        {links.map(({ to, label }) => (
          <Link key={to} to={to} className="hover:underline">{label}</Link>
        ))}

        {/* Notification Bell */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(s => !s)}
              className="relative p-1 hover:text-blue-200 transition"
              title="Notifications"
            >
              🔔
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-8 w-80 bg-white text-gray-800 rounded-xl shadow-xl z-50 border">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                  <span className="font-semibold text-sm">Notifications</span>
                  {notifications.length > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No new notifications</p>
                ) : (
                  <ul className="max-h-64 overflow-y-auto divide-y">
                    {notifications.map(n => (
                      <li key={n.id} className="px-4 py-3 hover:bg-gray-50">
                        <p className="text-xs font-medium text-blue-700">{n.eventType.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        <span className="text-blue-200">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="bg-white text-blue-700 px-3 py-1 rounded font-semibold hover:bg-blue-100 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}