import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
});

const isLikelyJwt = (token) =>
  typeof token === "string" &&
  token !== "null" &&
  token !== "undefined" &&
  token.split(".").length === 3;

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (isLikelyJwt(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (token) {
    localStorage.clear();
  }
  return config;
});

// Auto-logout on invalid/expired/unauthorized session
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default api;