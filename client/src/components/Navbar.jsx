import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getStoredUser, getToken, logout } from "../services/api.js";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getToken();
  const user = getStoredUser();
  
  // Check user role
  const userRole = user?.role || "candidate";
  const isRecruiter = userRole === "recruiter";

  // Auth pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return (
      <nav className="navbar" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="navbar-brand" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
          <span className="logo">🎯</span>
          <span className="brand-text">AI Job Platform</span>
        </div>
        <div className="nav-links">
          <Link to="/jobs" className="nav-link">Browse Jobs</Link>
        </div>
      </nav>
    );
  }

  // Landing page
  if (location.pathname === "/") {
    return (
      <nav className="navbar" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="navbar-brand" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
          <span className="logo">🎯</span>
          <span className="brand-text">AI Job Platform</span>
        </div>
        <div className="nav-links">
          <Link to="/jobs" className="nav-link">Browse Jobs</Link>
          {token ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ marginLeft: '1rem' }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ marginLeft: '1rem' }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    );
  }

  // Job browse page
  if (location.pathname === "/jobs") {
    return (
      <nav className="navbar" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="navbar-brand" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
          <span className="logo">🎯</span>
          <span className="brand-text">AI Job Platform</span>
        </div>
        <div className="nav-links">
          {token ? (
            <Link to="/dashboard" className="btn btn-primary">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ marginLeft: '1rem' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    );
  }

  // Protected pages - show nav when logged in
  if (token) {
    const candidateNavItems = [
      { path: "/dashboard", label: "Dashboard" },
      { path: "/jobs", label: "Find Jobs" },
      { path: "/history", label: "Applications" },
      { path: "/profile", label: "Profile" },
    ];

    const recruiterNavItems = [
      { path: "/dashboard", label: "Dashboard" },
      { path: "/recruiter/jobs", label: "My Jobs" },
      { path: "/recruiter/candidates", label: "Find Talent" },
      { path: "/profile", label: "Profile" },
    ];

    const navItems = isRecruiter ? recruiterNavItems : candidateNavItems;

    const handleLogout = () => {
      logout();
      navigate("/");
    };

    return (
      <nav className="navbar" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="navbar-brand" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
          <span className="logo">🎯</span>
          <span className="brand-text">AI Job Platform</span>
        </div>
        <div className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
          <button className="nav-link logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
    );
  }

  // Default - minimal nav
  return (
    <nav className="navbar" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div className="navbar-brand" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
        <span className="logo">🎯</span>
        <span className="brand-text">AI Job Platform</span>
      </div>
      <div className="nav-links">
        <Link to="/jobs" className="nav-link">Browse Jobs</Link>
        <Link to="/login" className="btn btn-primary">
          Login
        </Link>
      </div>
    </nav>
  );
}
