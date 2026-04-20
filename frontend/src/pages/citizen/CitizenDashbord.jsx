import { Link } from "react-router-dom";
import Navbar from "../../components/shared/Navbar";
import { useAuth } from "../../context/useAuth";

export default function CitizenDashboard() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={[
        { to: "/citizen/complaints", label: "My Complaints" },
        { to: "/citizen/submit",     label: "New Complaint" },
      ]} />
      <div className="max-w-2xl mx-auto p-6 space-y-4 mt-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome, {user?.email}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link to="/citizen/submit"
            className="bg-blue-600 text-white rounded-2xl p-6 text-center shadow hover:bg-blue-700 transition">
            <div className="text-4xl mb-2">📝</div>
            <div className="font-semibold text-lg">Submit Complaint</div>
            <div className="text-sm text-blue-100 mt-1">Report an issue in your area</div>
          </Link>
          <Link to="/citizen/complaints"
            className="bg-white border rounded-2xl p-6 text-center shadow hover:shadow-md transition">
            <div className="text-4xl mb-2">📋</div>
            <div className="font-semibold text-lg text-gray-800">My Complaints</div>
            <div className="text-sm text-gray-500 mt-1">Track your submitted reports</div>
          </Link>
        </div>
      </div>
    </div>
  );
}