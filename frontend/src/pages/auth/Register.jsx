import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";

const GOVERNORATES = [
  "TUNIS","ARIANA","BEN_AROUS","MANOUBA","NABEUL","ZAGHOUAN",
  "BIZERTE","BEJA","JENDOUBA","LE_KEF","SILIANA","SOUSSE",
  "MONASTIR","MAHDIA","SFAX","KAIROUAN","KASSERINE","SIDI_BOUZID",
  "GABES","MEDENINE","TATAOUINE","GAFSA","TOZEUR","KEBILI"
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "",
    phoneNumber: "", identifiantUnique: "", role: "CITIZEN",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        identifiantUnique: form.role === "CITIZEN" ? form.identifiantUnique : null,
      };
      await api.post("/auth/register", payload);
      navigate("/login");
    } catch (err) {
      const apiMessage =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : "");
      setError(apiMessage || "Registration failed");
    }
  };

  const field = (label, key, type = "text") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} required
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field("First Name", "firstName")}
            {field("Last Name",  "lastName")}
          </div>
          {field("Email", "email", "email")}
          {field("Password", "password", "password")}
          {field("Phone Number", "phoneNumber")}

          {form.role === "CITIZEN" && field("Identifiant Unique (11 digits)", "identifiantUnique")}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              <option value="CITIZEN">Citizen</option>
              <option value="AGENT">Municipal Agent</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Register
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}