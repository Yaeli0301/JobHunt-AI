import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchHistory } from "../services/api.js";

/**
 * Candidate — list of saved analyze/match runs (from MongoDB when available).
 */
function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchHistory({ limit: 100 });
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "לא ניתן לטעון היסטוריה");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard" style={{ padding: "2rem" }}>
        <div className="spinner-lg" />
      </div>
    );
  }

  return (
    <div className="dashboard" style={{ padding: "2rem", maxWidth: "900px" }}>
      <h1 className="mb-md">היסטוריית התאמות</h1>
      <p className="text-secondary mb-xl">
        ניתוחים שביצעת למשרות — עוזר לך לראות מגמות ולשפר פרופיל.
      </p>

      {error && (
        <div className="error-banner mb-lg" role="alert">
          {error}
        </div>
      )}

      {!error && items.length === 0 ? (
        <div className="glass-card p-lg text-center">
          <p className="text-muted mb-lg">עדיין אין ניתוחים שמורים.</p>
          <p className="text-secondary mb-lg">
            העלה קורות חיים בפרופיל, גלוש למשרות ובדוק התאמה כדי לראות תוצאות כאן.
          </p>
          <Link to="/jobs" className="btn btn-primary">
            גלוש משרות
          </Link>
          <Link to="/profile" className="btn btn-secondary mt-md" style={{ display: "block" }}>
            השלם פרופיל
          </Link>
        </div>
      ) : (
        <ul className="stack gap-md">
          {items.map((row) => (
            <li key={row.id || row._id} className="glass-card p-md">
              <div className="flex justify-between items-start">
                <div>
                  <h4>{row.job?.title || "משרה"}</h4>
                  <p className="text-sm text-muted">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString()
                      : ""}
                  </p>
                </div>
                <span className="badge badge-primary">{row.matchScore}%</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default History;
