import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchMyJobs, fetchJobApplicants } from "../services/api.js";

/**
 * Recruiter: review applicants per job, filter by match score and status.
 */

function RecruiterCandidates() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [filters, setFilters] = useState({ minScore: "", status: "" });
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingJobs(true);
      try {
        const data = await fetchMyJobs({ page: 1, limit: 100 });
        if (cancelled) return;
        const list = data?.jobs || [];
        setJobs(list);
        if (list.length > 0) {
          setSelectedJob((prev) => prev || list[0]._id);
        }
      } catch (error) {
        console.error("Load jobs failed:", error);
      } finally {
        if (!cancelled) setLoadingJobs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    let cancelled = false;
    const id = setTimeout(() => {
      (async () => {
        setLoadingApplicants(true);
        try {
          const data = await fetchJobApplicants(selectedJob, {
            minScore: filters.minScore || undefined,
            status: filters.status || undefined,
            sort: "matchScore",
          });
          if (!cancelled) setApplicants(data?.applicants || []);
        } catch (error) {
          console.error("Load applicants failed:", error);
          if (!cancelled) setApplicants([]);
        } finally {
          if (!cancelled) setLoadingApplicants(false);
        }
      })();
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [selectedJob, filters.minScore, filters.status]);

  const ApplicantCard = ({ applicant }) => {
    const preview = applicant.message
      ? applicant.message.length > 120
        ? `${applicant.message.substring(0, 120)}…`
        : applicant.message
      : null;

    return (
      <div className="glass-card p-md mb-sm">
        <div className="flex justify-between items-start">
          <div>
            <h5>{applicant.candidate?.name || "Candidate"}</h5>
            <p className="text-secondary">{applicant.candidate?.title || "—"}</p>
          </div>
          <div className="text-right">
            <div
              className="score-circle"
              style={{
                "--score": applicant.matchScore || 0,
                width: "60px",
                height: "60px",
                marginBottom: "0.5rem",
              }}
            >
              <span>{Math.round(applicant.matchScore ?? 0)}%</span>
            </div>
            <span className="badge badge-primary">{applicant.status || "pending"}</span>
          </div>
        </div>
        <div className="mt-sm">
          <p className="text-sm text-muted mb-sm">
            Matched: {(applicant.matchedSkills || []).slice(0, 6).join(", ") || "—"}
          </p>
          {(applicant.missingSkills || []).length > 0 && (
            <p className="text-sm text-muted mb-sm">
              Gaps: {(applicant.missingSkills || []).slice(0, 4).join(", ")}
            </p>
          )}
          {preview && <p className="text-sm italic">&ldquo;{preview}&rdquo;</p>}
        </div>
      </div>
    );
  };

  if (loadingJobs) {
    return (
      <div className="dashboard">
        <div className="spinner-lg" />
      </div>
    );
  }

  return (
    <div className="dashboard" style={{ padding: "2rem" }}>
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h1>מועמדים לפי משרה</h1>
          <p className="text-secondary mt-sm">
            סננו לפי ציון התאמה וסטטוס כדי להתמקד במועמדים הרלוונטיים ביותר.
          </p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-xl glass-card p-lg">
          <h4>אין עדיין משרות</h4>
          <p className="text-muted mb-lg">צרו משרה ראשונה כדי לקבל מועמדים.</p>
          <Link to="/recruiter/jobs" className="btn btn-primary">
            ניהול משרות
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-4 gap-md mb-lg">
            {jobs.map((job) => (
              <button
                key={job._id}
                type="button"
                className={`btn ${selectedJob === job._id ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSelectedJob(job._id)}
              >
                {job.title} ({job.applications || 0})
              </button>
            ))}
          </div>

          <div className="filters-row mb-md">
            <div className="flex gap-sm flex-wrap">
              <input
                className="input"
                placeholder="מינימום ציון התאמה (0–100)"
                value={filters.minScore}
                onChange={(e) => setFilters((f) => ({ ...f, minScore: e.target.value }))}
                type="number"
                min={0}
                max={100}
              />
              <select
                className="input"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">כל הסטטוסים</option>
                <option value="pending">ממתין</option>
                <option value="reviewing">בבדיקה</option>
                <option value="shortlisted">רשימה קצרה</option>
                <option value="interview">ריאיון</option>
                <option value="offer">הצעה</option>
                <option value="hired">התקבל</option>
                <option value="rejected">נדחה</option>
                <option value="withdrawn">בוטל</option>
              </select>
            </div>
            <p className="text-muted text-sm mt-sm">עדכון קצר לאחר שינוי סינון (מונע ריצוד בזמן הקלדה).</p>
          </div>

          {loadingApplicants ? (
            <div className="flex justify-center py-xl">
              <div className="spinner" />
            </div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-xl">
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>👥</div>
              <h4>אין מועמדים עדיין</h4>
              <p className="text-muted">שתפו את המשרה או הרחיבו את הפילטרים.</p>
            </div>
          ) : (
            <div className="applicants-list">
              {applicants.map((applicant) => (
                <ApplicantCard key={applicant._id} applicant={applicant} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RecruiterCandidates;
