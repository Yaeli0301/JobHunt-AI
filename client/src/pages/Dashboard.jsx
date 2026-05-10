import React, { useState, useEffect } from "react";
import {
  getStoredUser,
  fetchMyApplications,
  fetchHistory,
  fetchMyJobs,
  fetchRecommendations,
} from "../services/api.js";
import { Link } from "react-router-dom";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("candidate");
  const [error, setError] = useState(null);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    const storedUser = getStoredUser();
    const r = storedUser?.role || "candidate";
    if (storedUser) {
      setUser(storedUser);
      setRole(r);
    }
    loadStats(r);
  }, []);

  async function loadStats(effectiveRole) {
    const r = effectiveRole ?? getStoredUser()?.role ?? "candidate";
    setLoading(true);
    setError(null);
    try {
      if (r === "candidate") {
        let matches = 0;
        try {
          const history = await fetchHistory({ limit: 50 });
          matches = Array.isArray(history) ? history.length : 0;
        } catch {
          matches = 0;
        }
        let appCount = 0;
        try {
          const appData = await fetchMyApplications({ limit: 50 });
          appCount = (appData?.applications || []).length;
        } catch {
          appCount = 0;
        }
        let recJobs = [];
        try {
          const rec = await fetchRecommendations();
          recJobs = rec?.jobs || [];
        } catch {
          recJobs = [];
        }
        setRecommended(recJobs);
        setStats({
          matches,
          applications: appCount,
          savedJobs: 0,
        });
      } else {
        const data = await fetchMyJobs({ page: 1, limit: 200 });
        const jobs = data?.jobs || [];
        const jobsActive = jobs.filter((j) => j.status === "active").length;
        const applicantsTotal = jobs.reduce(
          (sum, j) => sum + (j.applications || 0),
          0
        );
        setRecommended([]);
        setStats({
          jobsActive,
          applicantsTotal,
          topMatch: "—",
        });
      }
    } catch (e) {
      setError(e.message || "טעינת נתונים נכשלה");
    } finally {
      setLoading(false);
    }
  }

  const CandidateDashboard = () => (
    <div>
      {recommended.length > 0 && (
        <div className="glass-card p-lg mb-xl">
          <h4 className="mb-md">משרות שעשויות לעניין אותך</h4>
          <div className="grid gap-sm">
            {recommended.slice(0, 5).map((job) => (
              <Link
                key={job._id}
                to={`/jobs/${job._id}`}
                className="flex justify-between items-center p-sm"
                style={{
                  borderBottom: "1px solid var(--border-color)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span>{job.title}</span>
                <span className="text-muted text-sm">
                  {job.location || "—"}
                </span>
              </Link>
            ))}
          </div>
          <Link to="/jobs" className="btn btn-secondary mt-md">
            כל המשרות
          </Link>
        </div>
      )}

      <div className="grid grid-3 gap-md mb-xl">
        <div className="glass-card text-center p-lg">
          <h3 className="text-3xl font-bold text-primary">{stats.matches || 0}</h3>
          <p className="text-secondary">ניתוחי התאמה</p>
        </div>
        <div className="glass-card text-center p-lg">
          <h3 className="text-3xl font-bold text-success">{stats.applications || 0}</h3>
          <p className="text-secondary">מועמדויות</p>
        </div>
        <div className="glass-card text-center p-lg">
          <h3 className="text-3xl font-bold text-accent">{stats.savedJobs || 0}</h3>
          <p className="text-secondary">שמירות</p>
        </div>
      </div>

      <div className="glass-card p-lg mb-xl">
        <h4 className="mb-sm">התחלה מהירה</h4>
        <ol className="text-secondary" style={{ paddingInlineStart: "1.25rem" }}>
          <li className="mb-sm">השלם פרופיל והמיומנויות שלך</li>
          <li className="mb-sm">חפש משרה ובדוק התאמה</li>
          <li>שלח מועמדות למשרות המתאימות</li>
        </ol>
        <div className="flex gap-sm mt-md flex-wrap">
          <Link to="/profile" className="btn btn-primary">
            פרופיל
          </Link>
          <Link to="/jobs" className="btn btn-secondary">
            חיפוש משרות
          </Link>
        </div>
      </div>

      <div className="grid grid-2 gap-lg">
        <div className="glass-card p-lg">
          <h4>היסטוריית ניתוחים</h4>
          <p className="text-muted mt-sm">
            כל ההתאמות ששמרת מופיעות בהיסטוריה.
          </p>
          <Link to="/history" className="btn btn-secondary mt-md">
            פתח היסטוריה
          </Link>
        </div>
        <div className="glass-card p-lg">
          <h4>מועמדויות</h4>
          <p className="text-muted mt-sm">עקוב אחרי סטטוס אחרי שליחה.</p>
          <Link to="/jobs" className="btn btn-primary mt-md">
            מצא עוד משרות
          </Link>
        </div>
      </div>
    </div>
  );

  const RecruiterDashboard = () => (
    <div>
      <div className="grid grid-3 gap-md mb-xl">
        <div className="glass-card text-center p-lg">
          <h3 className="text-3xl font-bold text-primary">{stats.jobsActive || 0}</h3>
          <p className="text-secondary">משרות פעילות</p>
        </div>
        <div className="glass-card text-center p-lg">
          <h3 className="text-3xl font-bold text-success">
            {stats.applicantsTotal || 0}
          </h3>
          <p className="text-secondary">סה״כ מועמדויות</p>
        </div>
        <div className="glass-card text-center p-lg">
          <h3 className="text-3xl font-bold text-accent">{stats.topMatch ?? "—"}</h3>
          <p className="text-secondary">התאמה מקסימלית</p>
        </div>
      </div>

      <div className="glass-card p-lg mb-xl">
        <h4 className="mb-sm">תהליך גיוס</h4>
        <ol className="text-secondary" style={{ paddingInlineStart: "1.25rem" }}>
          <li className="mb-sm">פרסם משרה עם מיומנויות נדרשות</li>
          <li className="mb-sm">סנן מועמדים לפי ציון התאמה</li>
          <li>צמצם רשימה וקבע ראיונות</li>
        </ol>
      </div>

      <div className="grid grid-2 gap-lg">
        <div className="glass-card p-lg">
          <h4>המשרות שלי</h4>
          <Link to="/recruiter/jobs" className="btn btn-primary mt-md">
            ניהול משרות
          </Link>
        </div>
        <div className="glass-card p-lg">
          <h4>מועמדים</h4>
          <p className="text-muted text-sm mt-sm">
            אין מועמדים עדיין — נסה להרחיב את דרישות המשרה או לשתף את המודעה.
          </p>
          <Link to="/recruiter/candidates" className="btn btn-primary mt-md">
            סינון מועמדים
          </Link>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard" style={{ padding: "2rem" }}>
      <div className="flex justify-between items-center mb-xl">
        <div>
          <h1>{role === "recruiter" ? "לוח בקרה — מגייס" : "לוח בקרה — מועמד"}</h1>
          <p>שלום, {user?.profile?.name || user?.email}</p>
        </div>
      </div>

      {error && (
        <div className="error-banner mb-lg" role="alert">
          {error}
        </div>
      )}

      {role === "candidate" ? <CandidateDashboard /> : <RecruiterDashboard />}
    </div>
  );
}

export default Dashboard;
