import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { register } from "../services/api.js";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromLanding = location.state?.role === "recruiter";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(fromLanding ? "recruiter" : "candidate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register(email, password, name, title, role);
      if (role === "recruiter") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-card" style={{ maxWidth: '450px' }}>
        <div className="auth-header">
          <h1>Create Account</h1>
          <p className="subtitle" style={{ marginBottom: '1.5rem' }}>
            Join the AI job platform
          </p>
        </div>

        {/* Role Selection */}
        <div className="flex gap-md mb-lg">
          <button
            type="button"
            className={`btn ${role === 'candidate' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '1rem' }}
            onClick={() => setRole("candidate")}
          >
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>👔</span>
            <strong>Find a Job</strong>
            <p className="text-sm" style={{ fontWeight: 'normal', marginTop: '0.25rem' }}>
              I'm looking for work
            </p>
          </button>
          <button
            type="button"
            className={`btn ${role === 'recruiter' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '1rem' }}
            onClick={() => setRole("recruiter")}
          >
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>💼</span>
            <strong>Hire Talent</strong>
            <p className="text-sm" style={{ fontWeight: 'normal', marginTop: '0.25rem' }}>
              I want to hire
            </p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-banner">{error}</div>}

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {role === "candidate" && (
            <div className="form-group">
              <label>Current Title (optional)</label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Full Stack Developer"
              />
            </div>
          )}

          {role === "recruiter" && (
            <div className="form-group">
              <label>Company Name (optional)</label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Your company name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Creating account..." : `Create ${role === 'candidate' ? 'Job Seeker' : 'Employer'} Account`}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="link-btn">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
