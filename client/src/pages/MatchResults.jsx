/**
 * MatchResults Page
 * Shows match score, skills match, strengths, weaknesses, AI explanation
 */

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { applyJob } from "../services/api.js";

function MatchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { analysis, job } = location.state || {};

  const [applying, setApplying] = useState(false);

  if (!analysis || !job) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">No match data found</h1>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
            onClick={() => navigate("/jobs")}
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  const handleApply = async () => {
    setApplying(true);
    try {
      await applyJob(job._id, {
        message: analysis.messageToRecruiter,
        analysisId: analysis._id
      });
      navigate("/dashboard", { state: { applied: true } });
    } catch (error) {
      console.error("Apply failed:", error);
      alert("Failed to apply. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Match Results</h1>
          <p className="text-slate-300">for {job.title} at {job.recruiterInfo?.company}</p>
        </div>

        {/* Match Score */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 text-center">
          <div className="text-6xl font-bold text-indigo-400 mb-2">
            {analysis.score}%
          </div>
          <p className="text-slate-300">Match Score</p>
        </div>

        {/* Skills Match */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-green-400">✅ Matched Skills</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.matchedSkills?.map((skill, index) => (
                <span key={index} className="bg-green-600 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              )) || <p className="text-slate-400">None</p>}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-red-400">❌ Missing Skills</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.missingSkills?.map((skill, index) => (
                <span key={index} className="bg-red-600 px-3 py-1 rounded-full text-sm">
                  {skill}
                </span>
              )) || <p className="text-slate-400">None</p>}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">💪 Strengths</h3>
            <ul className="space-y-2">
              {analysis.strengths?.map((strength, index) => (
                <li key={index} className="text-slate-300">• {strength}</li>
              )) || <li className="text-slate-400">No strengths identified</li>}
            </ul>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-orange-400">⚠️ Weaknesses</h3>
            <ul className="space-y-2">
              {analysis.weaknesses?.map((weakness, index) => (
                <li key={index} className="text-slate-300">• {weakness}</li>
              )) || <li className="text-slate-400">No weaknesses identified</li>}
            </ul>
          </div>
        </div>

        {/* AI Explanation */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">🤖 AI Analysis</h3>
          <p className="text-slate-300 leading-relaxed">
            {analysis.messageToRecruiter || "No AI analysis available."}
          </p>
        </div>

        {/* Career Advice */}
        {analysis.careerAdvice && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">🎯 Career Advice</h3>
            <p className="text-slate-300 leading-relaxed">
              {analysis.careerAdvice}
            </p>
          </div>
        )}

        {/* Apply Button */}
        <div className="text-center">
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg text-lg disabled:opacity-50"
            onClick={handleApply}
            disabled={applying}
          >
            {applying ? 'Applying...' : '🚀 Apply Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchResults;