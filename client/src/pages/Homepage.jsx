/**
 * Homepage
 * Landing page with dual CTA: Find a Job / Hire Talent
 * No login required
 */

import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Hero Section with two CTAs
 */
function Hero() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-white mb-8">
          AI Job Matching
        </h1>
        <p className="text-xl text-slate-300 mb-4 max-w-2xl mx-auto">
          Find your perfect job or hire top talent with AI-powered matching.
          Fast, clear, and efficient.
        </p>
        <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
          למועמדים: התאמה וסינון חכם. למגייסים: מועמדים מדורגים לפי ציון התאמה — פחות רעש, יותר החלטות.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center gap-2"
            onClick={() => navigate("/jobs")}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            Find a Job
          </button>
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center gap-2"
            onClick={() => navigate("/register", { state: { role: "recruiter" } })}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Hire Talent
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Homepage Component
 */
function Homepage() {
  return <Hero />;
}

export default Homepage;
