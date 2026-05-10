/**
 * JobDetails Page
 * Job description, requirements, and match analysis
 * No login required to view, login required for match/apply
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchJob, matchJob, applyJob, getToken } from "../services/api.js";

/**
 * Job Header Section
 */
function JobHeader({ job, onBack }) {
  const formatSalary = (salary) => {
    if (!salary?.min && !salary?.max) return "Not specified";
    const min = salary.min ? `$${(salary.min / 1000).toFixed(0)}k` : '';
    const max = salary.max ? `$${(salary.max / 1000).toFixed(0)}k` : '';
    return `${min}${min && max ? ' - ' : ''}${max}/year`;
  };

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <button 
        className="btn btn-secondary mb-lg" 
        onClick={onBack}
        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
      >
        ← Back to Jobs
      </button>
      
      <div className="flex justify-between items-start">
        <div>
          <h2>{job.title}</h2>
          <p className="text-secondary mt-sm">
            {job.recruiterInfo?.company || 'Hiring Company'} 
            {job.recruiterInfo?.industry && ` • ${job.recruiterInfo.industry}`}
          </p>
        </div>
        
        <span className="badge badge-success badge-lg" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
          {job.workType === 'remote' ? 'Remote' : 
           job.workType === 'onsite' ? 'On-site' : 
           job.workType === 'hybrid' ? 'Hybrid' : 'Flexible'}
        </span>
      </div>

      <div className="flex gap-lg mt-lg text-secondary">
        <span>📍 {job.location || 'Remote'}</span>
        <span>💰 {formatSalary(job.salaryRange)}</span>
        <span>📊 {job.experienceLevel || 'Any'} Level</span>
        <span>⏰ {job.jobType || 'Full-time'}</span>
      </div>
    </div>
  );
}

/**
 * Job Description Section
 */
function JobDescription({ job }) {
  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <h4 className="mb-md">About This Role</h4>
      <p className="text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
        {job.description}
      </p>

      {job.responsibilities?.length > 0 && (
        <div className="mt-lg">
          <h5 className="mb-sm">Responsibilities</h5>
          <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
            {job.responsibilities.map((resp, idx) => (
              <li key={idx} className="mb-sm">{resp}</li>
            ))}
          </ul>
        </div>
      )}

      {job.requirements?.length > 0 && (
        <div className="mt-lg">
          <h5 className="mb-sm">Requirements</h5>
          <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
            {job.requirements.map((req, idx) => (
              <li key={idx} className="mb-sm">{req}</li>
            ))}
          </ul>
        </div>
      )}

      {job.benefits?.length > 0 && (
        <div className="mt-lg">
          <h5 className="mb-sm">Benefits</h5>
          <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
            {job.benefits.map((ben, idx) => (
              <li key={idx} className="mb-sm">{ben}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Skills Required
 */
function SkillsRequired({ job }) {
  const skills = job.requiredSkills || [];
  
  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <h4 className="mb-md">Required Skills</h4>
      <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
        {skills.map((skill, idx) => (
          <span key={idx} className="skill-tag">
            {typeof skill === 'string' ? skill : skill.name}
            {skill.level && skill.level !== 'intermediate' && (
              <span className="text-muted"> ({skill.level})</span>
            )}
          </span>
        ))}
        {skills.length === 0 && (
          <p className="text-muted">No specific skills required</p>
        )}
      </div>
    </div>
  );
}

/**
 * Apply Modal
 */
function ApplyModal({ job, onClose, onSubmit }) {
  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);

  async function handleApply() {
    setApplying(true);
    try {
      await onSubmit(message || undefined);
    } catch (error) {
      console.error("Apply failed:", error);
      alert(error.message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div className="glass-card" style={{ 
        width: '90%', 
        maxWidth: '500px', 
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '2rem'
      }}>
        <h3 className="mb-lg">Apply to {job.title}</h3>
        
        <div className="mb-lg">
          <label className="label">Message to Recruiter (optional)</label>
          <textarea
            className="input"
            rows={5}
            placeholder="Introduce yourself, highlight relevant experience..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-muted text-sm mt-sm">
            A message will be auto-generated if left empty.
          </p>
        </div>

        <div className="flex gap-md">
          <button className="btn btn-secondary" onClick={onClose} disabled={applying}>
            Cancel
          </button>
          <button className="btn btn-success" onClick={handleApply} disabled={applying}>
            {applying ? 'Sending...' : 'Send Application'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main JobDetails Component
 */
function JobDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const isLoggedIn = !!getToken();

  const loadJob = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJob(id);
      setJob(data);
    } catch (error) {
      console.error("Failed to load job:", error);
      alert("Job not found");
      navigate("/jobs");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  async function handleCheckMatch() {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: `/jobs/${id}` } });
      return;
    }

    setAnalyzing(true);
    try {
      const result = await matchJob(id);
      const mergedJob = { ...job, ...result.job };
      const analysis = {
        score: result.score,
        matchedSkills: result.matchedSkills,
        missingSkills: result.missingSkills,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        messageToRecruiter:
          result.messageToRecruiter ||
          result.careerAdvice ||
          "Match analysis complete.",
        careerAdvice: result.careerAdvice,
        breakdown: result.breakdown,
        aiUsed: result.aiUsed,
        _id: result.analysisId,
      };
      navigate(`/jobs/${id}/match`, {
        state: { analysis, job: mergedJob },
      });
    } catch (error) {
      console.error("Match failed:", error);
      alert(error.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleApply(message) {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: `/jobs/${id}` } });
      return;
    }

    try {
      await applyJob(id, message);
      alert("Application sent successfully!");
      setShowApplyModal(false);
      navigate("/dashboard");
    } catch (error) {
      throw error;
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center" style={{ padding: '4rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="job-details-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <JobHeader job={job} onBack={() => navigate("/jobs")} />
      
      <div className="grid" style={{ 
        gridTemplateColumns: '1fr 380px', 
        gap: '2rem',
        marginTop: '2rem' 
      }}>
        {/* Main Content */}
        <div>
          <JobDescription job={job} />
          <div className="mt-lg">
            <SkillsRequired job={job} />
          </div>
        </div>

        {/* Sidebar - Action Panel */}
        <div>
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h4 className="mb-md">Interested in this job?</h4>
            <p className="text-secondary mb-lg">
              Check how well you match the requirements and see what skills you have and what's missing.
            </p>
            <button 
              className="btn btn-primary btn-large btn-block"
              onClick={handleCheckMatch}
              disabled={analyzing}
            >
              {analyzing ? 'Analyzing...' : 'Check My Match'}
            </button>
            <p className="text-muted text-sm mt-md">
              Login required to check match
            </p>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <ApplyModal 
          job={job} 
          onClose={() => setShowApplyModal(false)} 
          onSubmit={handleApply}
        />
      )}
    </div>
  );
}

export default JobDetails;
