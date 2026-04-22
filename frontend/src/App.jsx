import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Login            from "./pages/auth/Login";
import Register         from "./pages/auth/Register";
import Home             from "./pages/home/Home";
import CitizenDashboard from "./pages/citizen/CitizenDashbord";
import SubmitComplaint  from "./pages/citizen/SubmitComplaint";
import MyComplaints     from "./pages/citizen/MyComplaints";
import AdminDashboard   from "./pages/admin/AdminDashboard";
import Analytics        from "./pages/admin/Analytics";
import AgentDashboard   from "./pages/agent/AgentDashboard";
import PageMetadata     from "./components/shared/PageMetadata";
import ProtectedRoute   from "./routes/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PageMetadata />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public home */}
          <Route path="/" element={<Home />} />

          {/* Citizen */}
          <Route path="/citizen" element={
            <ProtectedRoute allowedRoles={["ROLE_CITIZEN"]}>
              <CitizenDashboard />
            </ProtectedRoute>
          } />
          <Route path="/citizen/submit" element={
            <ProtectedRoute allowedRoles={["ROLE_CITIZEN"]}>
              <SubmitComplaint />
            </ProtectedRoute>
          } />
          <Route path="/citizen/complaints" element={
            <ProtectedRoute allowedRoles={["ROLE_CITIZEN"]}>
              <MyComplaints />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
              <Analytics />
            </ProtectedRoute>
          } />

          {/* Agent */}
          <Route path="/agent" element={
            <ProtectedRoute allowedRoles={["ROLE_AGENT"]}>
              <AgentDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="/unauthorized" element={
            <div className="flex items-center justify-center h-screen text-2xl text-red-500">
              403 — Access Denied
            </div>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}