import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NewAnalysis from "./pages/NewAnalysis.jsx";
import History from "./pages/History.jsx";
import ProfileBuilder from "./pages/ProfileBuilder.jsx";
import CoverLetter from "./pages/CoverLetter.jsx";
import Homepage from "./pages/Homepage.jsx";
import JobBrowse from "./pages/JobBrowse.jsx";
import JobDetails from "./pages/JobDetails.jsx";
import MatchResults from "./pages/MatchResults.jsx";
import RecruiterJobs from "./pages/RecruiterJobs.jsx";
import RecruiterCandidates from "./pages/RecruiterCandidates.jsx";
import { getToken, getStoredUser } from "./services/api.js";
import "./App.css";

/**
 * ProtectedRoute - redirects to login if not authenticated
 */
function ProtectedRoute({ children }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * PublicRoute - redirects to dashboard if logged in
 * Use for auth pages (login/register)
 */
function PublicRoute({ children }) {
  const token = getToken();
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

/** Only users registered as recruiters (hiring). */
function RecruiterRoute({ children }) {
  const user = getStoredUser();
  if (user?.role !== "recruiter") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* PUBLIC ROUTES - No login required */}
            <Route path="/" element={<Homepage />} />
            <Route path="/jobs" element={<JobBrowse />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/jobs/:id/match" element={<MatchResults />} />

            {/* AUTH ROUTES - Only when logged out */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* PROTECTED ROUTES - Login required */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/analysis" element={<ProtectedRoute><NewAnalysis /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileBuilder /></ProtectedRoute>} />
            <Route path="/cover-letter" element={<ProtectedRoute><CoverLetter /></ProtectedRoute>} />
            <Route path="/recruiter/jobs" element={<ProtectedRoute><RecruiterRoute><RecruiterJobs /></RecruiterRoute></ProtectedRoute>} />
            <Route path="/recruiter/candidates" element={<ProtectedRoute><RecruiterRoute><RecruiterCandidates /></RecruiterRoute></ProtectedRoute>} />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
