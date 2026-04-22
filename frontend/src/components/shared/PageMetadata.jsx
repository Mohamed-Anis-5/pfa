import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import projectLogo from "../../assets/logo.png";

const ROUTE_TITLES = {
  "/": "Home",
  "/login": "Sign In",
  "/register": "Create Account",
  "/citizen": "Citizen Dashboard",
  "/citizen/submit": "Submit Complaint",
  "/citizen/complaints": "My Complaints",
  "/admin": "Admin Dashboard",
  "/admin/analytics": "Analytics",
  "/agent": "Agent Dashboard",
  "/unauthorized": "Unauthorized",
};

function getPageName(pathname) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return ROUTE_TITLES[pathname.slice(0, -1)] ?? "Municipal Platform";
  }

  return ROUTE_TITLES[pathname] ?? "Municipal Platform";
}

export default function PageMetadata() {
  const location = useLocation();

  useEffect(() => {
    const pageName = getPageName(location.pathname);
    document.title = pageName === "Municipal Platform"
      ? pageName
      : `${pageName} | Municipal Platform`;

    let iconLink = document.querySelector("link[rel*='icon']");

    if (!iconLink) {
      iconLink = document.createElement("link");
      iconLink.rel = "icon";
      document.head.appendChild(iconLink);
    }

    iconLink.type = "image/png";
    iconLink.href = projectLogo;
  }, [location.pathname]);

  return null;
}