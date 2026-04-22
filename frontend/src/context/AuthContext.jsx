import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "./authContext";

function getStoredUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    const expiresAt = typeof decoded.exp === "number" ? decoded.exp * 1000 : null;

    if (!role || !email || (expiresAt !== null && expiresAt <= Date.now())) {
      localStorage.clear();
      return null;
    }

    return { token, role, email, decoded };
  } catch {
    localStorage.clear();
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const login = (token, email, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("email", email);
    localStorage.setItem("role", role);
    const decoded = jwtDecode(token);
    setUser({ token, role, email, decoded });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}