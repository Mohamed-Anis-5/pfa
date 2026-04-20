import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function Navbar({ links = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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