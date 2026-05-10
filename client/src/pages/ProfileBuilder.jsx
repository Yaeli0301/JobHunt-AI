import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProfile, updateProfile, uploadCV, generateBio } from '../services/api.js';

function ProfileBuilder() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load existing profile
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await fetchProfile();
      if (data.candidateProfile?.skills?.length > 0) {
        setProfile(data.candidateProfile);
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Load profile failed:", error);
    }
  }

  // Drag-drop handlers
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  async function handleFile(file) {
    if (!file.type.match(/pdf|document/)) {
      alert("Please upload PDF or DOCX");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload to backend
      const data = await uploadCV(file);
      
      // Show parsed results
      setProfile(data);
      setUploadProgress(100);
      
      // Auto-generate bio
      await generateAIProfile(data);
      
      // Save to user profile
      await updateProfile({ candidateProfile: data });
      
      setShowPreview(true);
      alert("Profile created successfully! 🎉");
    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function generateAIProfile(parsedData) {
    setGeneratingBio(true);
    try {
      const bio = await generateBio(parsedData);
      setProfile(prev => ({ ...prev, ...bio }));
      
      // Update again with bio
      await updateProfile({ 
        candidateProfile: { ...parsedData, ...bio }
      });
    } catch (error) {
      console.error("Bio generation failed:", error);
    } finally {
      setGeneratingBio(false);
    }
  }

  function ProfilePreview({ profile }) {
    return (
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div className="flex justify-between items-start mb-lg">
          <div>
            <h3>{profile.headline || profile.detectedRole}</h3>
            <p className="text-secondary">{profile.summaryShort || profile.summary}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Skills: {profile.skills?.length || 0}</p>
            <p className="text-sm text-muted">Experience: {profile.experienceYears || 0} years</p>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-lg">
          <h5>Skills</h5>
          <div className="flex gap-sm flex-wrap">
            {profile.skills?.slice(0, 8).map((skill, idx) => (
              <span key={idx} className="skill-tag">{skill.name || skill}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-md">
          <button 
            className="btn btn-primary flex-1" 
            onClick={() => navigate("/jobs")}
            disabled={uploading}
          >
            Find Matching Jobs →
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowPreview(false)}
          >
            Edit Profile
          </button>
        </div>
      </div>
    );
  }

  if (showPreview && profile) {
    return (
      <div className="profile-builder" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div className="flex justify-between items-center mb-lg">
          <h1>Profile Ready! 🎯</h1>
          <button className="btn btn-secondary" onClick={() => setShowPreview(false)}>
            Edit
          </button>
        </div>
        <ProfilePreview profile={profile} />
      </div>
    );
  }

  return (
    <div className="profile-builder" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Upload Your CV</h1>
      <p className="text-secondary mb-xl">
        Drag & drop your PDF/DOCX or click to browse. AI will auto-extract skills, experience, 
        and generate your professional profile. Ready to apply in 30 seconds.
      </p>

      {/* Drag Drop Area */}
      <div 
        className={`cv-upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: '3px dashed var(--border-color)',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          background: dragActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
          transition: 'all 0.2s',
          cursor: uploading ? 'wait' : 'pointer'
        }}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        {uploading ? (
          <div className="upload-progress">
            <div className="spinner mb-sm"></div>
            <p>
              {generatingBio
                ? "Generating your professional summary..."
                : `Processing your CV... ${uploadProgress}%`}
            </p>
            <div className="progress-bar" style={{ 
              width: '100%', height: '4px', background: 'var(--bg-secondary)', 
              borderRadius: '2px', overflow: 'hidden', marginTop: '1rem'
            }}>
              <div style={{ 
                width: `${uploadProgress}%`, height: '100%', 
                background: 'var(--accent-primary)', transition: 'width 0.3s'
              }} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
            <h3>Drop your CV here</h3>
            <p className="text-secondary mb-md">PDF or DOCX • Max 10MB</p>
            <label htmlFor="file-input" className="btn btn-primary">
              Choose File
            </label>
            <input
              id="file-input"
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              disabled={uploading}
            />
          </>
        )}
      </div>

      <div className="mt-xl text-center">
        <p className="text-sm text-muted">
          Already have a profile? <button 
            className="text-primary underline" 
            onClick={loadProfile}
          >
            Load it
          </button>
        </p>
      </div>
    </div>
  );
}

export default ProfileBuilder;