import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import api from "../../api/axios";
import AuthShell from "../../components/shared/AuthShell";

const loginHighlights = [
  {
    title: "Fast reporting workflow",
    text: "Citizen reports move from submission to field assignment through one calm interface.",
  },
  {
    title: "Built for municipal teams",
    text: "Agents and administrators get focused dashboards instead of generic admin panels.",
  },
  {
    title: "Transparent follow-up",
    text: "Every update remains visible so people can see whether an issue is being handled.",
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.email, data.role);
      if (data.role === "ROLE_CITIZEN") navigate("/citizen");
      else if (data.role === "ROLE_ADMIN") navigate("/admin");
      else if (data.role === "ROLE_AGENT") navigate("/agent");
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <AuthShell
      eyebrow="Account access"
      title="Sign in to manage local issues with a clearer workflow."
      description="Access the role-specific dashboard for reporting, assignment, and service follow-up in a more modern civic interface."
      highlights={loginHighlights}
      footer={(
        <p className="mt-6 text-sm text-[#5e746d]">
          No account yet?{" "}
          <Link to="/register" className="font-semibold text-[#16372d] hover:text-[#0f4f41]">
            Create one here
          </Link>
        </p>
      )}
    >
      <div className="space-y-6">
        <div>
          <p className="civic-kicker">Welcome back</p>
          <h2 className="mt-3 text-4xl tracking-[-0.04em] text-[#16372d]">Secure account sign in</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#5d736b]">
            Use the credentials linked to your citizen, agent, or administrator account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={error ? "login-error" : undefined}>
          <div className="civic-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email" required
              autoComplete="email"
              placeholder="you@municipality.tn"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="civic-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password" required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          {error && <p id="login-error" role="alert" className="civic-alert">{error}</p>}
          <button type="submit" className="civic-button-primary w-full">
            Sign In
          </button>
        </form>
      </div>
    </AuthShell>
  );
}