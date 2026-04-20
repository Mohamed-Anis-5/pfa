import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      const role = localStorage.getItem("role");
      const email = localStorage.getItem("email");
      return { token, role, email, decoded };
    } catch {
      localStorage.clear();
      return null;
    }
  });

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