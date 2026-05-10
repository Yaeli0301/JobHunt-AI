import React, { useState, useEffect } from 'react';
import { fetchMyJobs, createJob as createJobPosting } from '../services/api.js';

const EMPTY_FORM = {
  title: '',
  description: '',
  requiredSkills: '',
  experienceLevel: 'any',
  experienceYears: 0,
  salaryRange: { min: '', max: '' },
  location: '',
  workType: 'any',
  jobType: 'full-time',
  responsibilities: '',
  requirements: '',
};

/**
 * Recruiter Jobs Dashboard
 * Create, manage, and view job postings
 */

function RecruiterJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState(() => ({ ...EMPTY_FORM }));
  const [creatingJob, setCreatingJob] = useState(false);

  useEffect(() => {
    loadMyJobs();
  }, []);

  async function loadMyJobs() {
    setLoading(true);
    try {
      const data = await fetchMyJobs({ page: 1, limit: 50 });
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Load jobs failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateJob(e) {
    e.preventDefault();
    setCreatingJob(true);
    try {
      const payload = {
        ...formData,
        requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        responsibilities: formData.responsibilities.split('\n').map(r => r.trim()).filter(Boolean),
        requirements: formData.requirements.split('\n').map(r => r.trim()).filter(Boolean),
        salaryRange: {
          min: formData.salaryRange.min ? Number(formData.salaryRange.min) : null,
          max: formData.salaryRange.max ? Number(formData.salaryRange.max) : null,
        },
      };

      await createJobPosting(payload);
      alert('Job created successfully!');
      setShowCreate(false);
      setFormData({ ...EMPTY_FORM });
      loadMyJobs();
    } catch (error) {
      alert('Create failed: ' + error.message);
    } finally {
      setCreatingJob(false);
    }
  }

  const JobCard = ({ job }) => (
    <div className="glass-card p-md mb-md">
      <div className="flex justify-between">
        <div>
          <h4>{job.title}</h4>
          <p className="text-secondary">{job.status}</p>
        </div>
        <div className="text-right">
          <p>📊 {job.applications || 0} applicants</p>
          <span className={`badge ${job.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
            {job.status}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard" style={{ padding: '2rem' }}>
      <div className="flex justify-between items-center mb-lg">
        <h1>My Jobs ({jobs.length})</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Create New Job
        </button>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : jobs.length === 0 ? (
        <div className="text-center py-xl">
          <p className="text-muted mb-lg">No jobs yet. Create your first job posting!</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            Create Job
          </button>
        </div>
      ) : (
        <div className="job-list">
          {jobs.map(job => <JobCard key={job._id} job={job} />)}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay">
          <div className="glass-card" style={{ maxWidth: '700px', margin: '2rem auto' }}>
            <h3>Create Job Posting</h3>
            <form onSubmit={handleCreateJob}>
              <div className="grid grid-2 gap-md">
                <input
                  className="input"
                  placeholder="Job Title (required)"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
                <select
                  className="input"
                  value={formData.jobType}
                  onChange={(e) => setFormData({...formData, jobType: e.target.value})}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>

              <textarea
                className="input mb-md"
                rows={4}
                placeholder="Job Description (required)"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />

              <div className="grid grid-2 gap-md mb-md">
                <input
                  className="input"
                  placeholder="Required Skills (comma separated)"
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({...formData, requiredSkills: e.target.value})}
                />
                <input
                  className="input"
                  placeholder="Experience Level"
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                />
              </div>

              <div className="grid grid-2 gap-md mb-md">
                <div>
                  <label>Salary Range ($/year)</label>
                  <div className="flex gap-sm">
                    <input
                      className="input flex-1"
                      placeholder="Min"
                      value={formData.salaryRange.min}
                      onChange={(e) => setFormData({
                        ...formData,
                        salaryRange: {...formData.salaryRange, min: e.target.value}
                      })}
                    />
                    <input
                      className="input flex-1"
                      placeholder="Max"
                      value={formData.salaryRange.max}
                      onChange={(e) => setFormData({
                        ...formData,
                        salaryRange: {...formData.salaryRange, max: e.target.value}
                      })}
                    />
                  </div>
                </div>
                <div>
                  <label>Location / Work Type</label>
                  <div className="flex gap-sm">
                    <input
                      className="input flex-1"
                      placeholder="City or Remote"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                    <select
                      className="input"
                      value={formData.workType}
                      onChange={(e) => setFormData({...formData, workType: e.target.value})}
                    >
                      <option value="any">Any</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-2 gap-md mb-md">
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Requirements (one per line)"
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                />
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Responsibilities (one per line)"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
                />
              </div>

              <div className="flex gap-md">
                <button type="submit" className="btn btn-success" disabled={creatingJob}>
                  {creatingJob ? 'Creating...' : 'Create Job'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecruiterJobs;

