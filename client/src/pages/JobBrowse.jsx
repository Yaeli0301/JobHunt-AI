/**
 * JobBrowse Page
 * Browse and search jobs with filters
 * No login required
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJobs, getStoredUser } from "../services/api.js";

/**
 * Filter Sidebar
 */
function Filters({ filters, onChange, onClear }) {
  const workTypes = [
    { value: "any", label: "Any" },
    { value: "remote", label: "Remote" },
    { value: "onsite", label: "On-site" },
    { value: "hybrid", label: "Hybrid" },
  ];

  const experienceLevels = [
    { value: "any", label: "Any" },
    { value: "entry", label: "Entry" },
    { value: "mid", label: "Mid" },
    { value: "senior", label: "Senior" },
    { value: "lead", label: "Lead" },
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6">
      <h4 className="text-white font-semibold mb-4">Filters</h4>
      
      {/* Search */}
      <div className="mb-6">
        <label className="block text-slate-300 text-sm mb-2">Search</label>
        <input
          type="text"
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Job title, role..."
          value={filters.role}
          onChange={(e) => onChange({ ...filters, role: e.target.value })}
        />
      </div>

      {/* Work Type */}
      <div className="mb-6">
        <label className="block text-slate-300 text-sm mb-2">Work Type</label>
        <select
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.workType}
          onChange={(e) => onChange({ ...filters, workType: e.target.value })}
        >
          {workTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Experience */}
      <div className="mb-lg">
        <label className="label">Experience</label>
        <select
          className="input"
          value={filters.experience}
          onChange={(e) => onChange({ ...filters, experience: e.target.value })}
        >
          {experienceLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      {/* Salary Range */}
      <div className="mb-lg">
        <label className="label">Min Salary ($/year)</label>
        <select
          className="input"
          value={filters.salaryMin}
          onChange={(e) => onChange({ ...filters, salaryMin: e.target.value })}
        >
          <option value="">Any</option>
          <option value="50000">$50k+</option>
          <option value="80000">$80k+</option>
          <option value="100000">$100k+</option>
          <option value="120000">$120k+</option>
          <option value="150000">$150k+</option>
        </select>
      </div>

      {/* Location */}
      <div className="mb-lg">
        <label className="label">Location</label>
        <input
          type="text"
          className="input"
          placeholder="City, state..."
          value={filters.location}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
        />
      </div>

      {/* Clear Button */}
      <button className="btn btn-secondary btn-block" onClick={onClear}>
        Clear Filters
      </button>
    </div>
  );
}

/**
 * Job Card
 */
function JobCard({ job, onClick }) {
  const formatSalary = (salary) => {
    if (!salary?.min && !salary?.max) return null;
    const min = salary.min ? `$${(salary.min / 1000).toFixed(0)}k` : '';
    const max = salary.max ? `$${(salary.max / 1000).toFixed(0)}k` : '';
    return `${min}${min && max ? ' - ' : ''}${max}/yr`;
  };

  const getWorkTypeBadge = (type) => {
    const badges = {
      remote: { label: "Remote", class: "badge-success" },
      onsite: { label: "On-site", class: "badge-warning" },
      hybrid: { label: "Hybrid", class: "badge-primary" },
      any: { label: "Flexible", class: "badge-primary" },
    };
    return badges[type] || badges.any;
  };

  const badge = getWorkTypeBadge(job.workType);

  return (
    <div className="job-card" onClick={onClick}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="job-title">{job.title}</h4>
          <p className="job-company mt-sm">
            {job.recruiterInfo?.company || job.recruiterInfo?.name || "חברה מגייסת"}
          </p>
        </div>
        <span className={`badge ${badge.class}`}>{badge.label}</span>
      </div>

      <div className="job-meta mt-md">
        <span className="job-location">
          📍 {job.location || 'Remote'}
        </span>
        {job.salaryRange && (
          <span className="job-salary">
            💰 {formatSalary(job.salaryRange)}
          </span>
        )}
        <span className="job-type">
          📊 {job.experienceLevel || "כל הרמות"}
        </span>
      </div>

      <div className="flex gap-sm mt-md" style={{ flexWrap: 'wrap' }}>
        {(job.requiredSkills || []).slice(0, 4).map((skill, idx) => (
          <span key={idx} className="skill-tag">
            {typeof skill === 'string' ? skill : skill.name}
          </span>
        ))}
        {(job.requiredSkills?.length || 0) > 4 && (
          <span className="skill-tag text-muted">
            +{job.requiredSkills.length - 4} more
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Pagination
 */
function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  return (
    <div className="flex justify-center gap-sm mt-xl">
      <button
        className="btn btn-secondary"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span className="flex items-center" style={{ padding: '0 1rem' }}>
        Page {page} of {pages}
      </span>
      <button
        className="btn btn-secondary"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

/**
 * Main JobBrowse Component
 */
function JobBrowse() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    role: "",
    workType: "any",
    experience: "any",
    salaryMin: "",
    location: "",
  });

  const loadJobs = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      setLoadError(null);
      try {
        const params = { page, limit: 12 };
        if (filters.role) params.role = filters.role;
        if (filters.workType && filters.workType !== "any")
          params.workType = filters.workType;
        if (filters.experience && filters.experience !== "any")
          params.experience = filters.experience;
        if (filters.salaryMin) params.salaryMin = filters.salaryMin;
        if (filters.location) params.location = filters.location;

        const data = await fetchJobs(params);
        setJobs(data.jobs || []);
        setPagination({
          page: data.pagination?.page || 1,
          pages: data.pagination?.pages || 1,
          total: data.pagination?.total || 0,
        });
      } catch (error) {
        console.error("Failed to load jobs:", error);
        setLoadError(error.message || "Failed to load jobs");
        setJobs([]);
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.page]
  );

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
    setPagination((p) => ({ ...p, page: 1 }));
    loadJobs(1);
  }

  function handleClearFilters() {
    const cleared = {
      role: "",
      workType: "any",
      experience: "any",
      salaryMin: "",
      location: "",
    };
    setFilters(cleared);
    setPagination((p) => ({ ...p, page: 1 }));
    loadJobs(1);
  }

  return (
    <div className="job-browse-page">
      {/* Header */}
      <header style={{ padding: '2rem', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex justify-between items-center">
          <h2>Browse Jobs</h2>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              user?.role === "recruiter"
                ? navigate("/recruiter/jobs")
                : navigate("/register", { state: { role: "recruiter" } })
            }
          >
            פרסם משרה
          </button>
        </div>
        <p className="text-secondary mt-sm">
          {pagination.total} jobs available
        </p>
      </header>

      {/* Main Content */}
      <div className="flex" style={{ gap: '2rem', padding: '2rem' }}>
        {/* Sidebar */}
        <aside style={{ width: '280px', flexShrink: 0 }}>
          <Filters
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </aside>

        {/* Job Grid */}
        <main style={{ flex: 1 }}>
          {loadError && (
            <div className="error-banner mb-md" role="alert">
              {loadError}
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-xl">
              <div className="spinner"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h4 className="empty-state-title">No jobs found</h4>
              <p className="empty-state-description">
                Try adjusting your filters or check back later for new opportunities.
              </p>
              <button className="btn btn-primary mt-lg" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-2">
                {jobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    onClick={() => navigate(`/jobs/${job._id}`)}
                  />
                ))}
              </div>
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                onChange={(p) => {
                  setPagination((prev) => ({ ...prev, page: p }));
                  loadJobs(p);
                }}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default JobBrowse;
