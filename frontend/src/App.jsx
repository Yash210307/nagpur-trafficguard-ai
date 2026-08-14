import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/api/dashboard";

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchDashboard = async () => {
    try {
      setIsUpdating(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load dashboard");
      }

      const data = await response.json();

      setDashboard(data);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
  fetch("https://nagpur-trafficguard-ai.onrender.com/api/dashboard")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load dashboard");
      }
      return response.json();
    })
    .then((data) => {
      setDashboard(data);
    })
    .catch((err) => {
      setError(err.message);
    });
}, []);

  const getRiskClass = (level) => {
    return String(level || "LOW").toLowerCase();
  };

  const getScoreClass = (score) => {
    if (score >= 70) return "score-high";
    if (score >= 40) return "score-medium";
    return "score-low";
  };

  if (!dashboard && !error) {
    return (
      <div className="app loading-screen">
        <div className="loading-card">
          <div className="loading-spinner"></div>
          <h2>TrafficGuard AI</h2>
          <p>Loading live traffic intelligence...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="app error-screen">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h1>Nagpur TrafficGuard AI</h1>
          <p>Backend connection failed.</p>
          <small>{error}</small>

          <button onClick={fetchDashboard}>
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">

        <div className="brand">
          <div className="brand-icon">🚦</div>

          <div>
            <h1>Nagpur TrafficGuard AI</h1>
            <p>AI-Powered Traffic Risk & Police Deployment</p>
          </div>
        </div>

        <div className="system-info">

          <div className="status">
            <span className="status-dot"></span>
            SYSTEM ONLINE
          </div>

          <div className="live-update">
            <span className={isUpdating ? "pulse active" : "pulse"}></span>
            LIVE DATA
          </div>

        </div>

      </header>

      <main>

        {/* DASHBOARD SUMMARY */}
        <section className="cards">

          <div className="card">
            <div className="card-top">
              <span>Total Locations</span>
              <span className="card-icon">📍</span>
            </div>

            <strong>{dashboard.total_locations}</strong>

            <small>Monitored locations</small>
          </div>

          <div className="card high">
            <div className="card-top">
              <span>High Risk</span>
              <span className="card-icon">🔴</span>
            </div>

            <strong>{dashboard.high_risk}</strong>

            <small>Immediate attention</small>
          </div>

          <div className="card medium">
            <div className="card-top">
              <span>Medium Risk</span>
              <span className="card-icon">🟠</span>
            </div>

            <strong>{dashboard.medium_risk}</strong>

            <small>Requires monitoring</small>
          </div>

          <div className="card low">
            <div className="card-top">
              <span>Low Risk</span>
              <span className="card-icon">🟢</span>
            </div>

            <strong>{dashboard.low_risk}</strong>

            <small>Normal traffic</small>
          </div>

          <div className="card officers">
            <div className="card-top">
              <span>Available Officers</span>
              <span className="card-icon">👮</span>
            </div>

            <strong>{dashboard.total_available_officers}</strong>

            <small>Ready for deployment</small>
          </div>

        </section>

        {/* LIVE STATUS BAR */}
        <section className="live-bar">

          <div>
            <span className="live-dot"></span>
            <strong>Real-Time Traffic Monitoring</strong>
          </div>

          <div className="updated">
            Last updated:{" "}
            {lastUpdated
              ? lastUpdated.toLocaleTimeString()
              : "--:--:--"}
          </div>

        </section>

        {/* PRIORITIES */}
        <section className="panel">

          <div className="panel-header">

            <div>
              <h2>🚨 Top Traffic Priorities</h2>
              <p>Locations requiring the most attention</p>
            </div>

            <div className="location-count">
              {dashboard.top_priorities.length}
              <span> locations</span>
            </div>

          </div>

          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>LOCATION</th>
                  <th>RISK SCORE</th>
                  <th>RISK LEVEL</th>
                  <th>POLICE</th>
                  <th>RECOMMENDED</th>
                  <th>COVERAGE GAP</th>
                </tr>
              </thead>

              <tbody>

                {dashboard.top_priorities.map((location) => {

                  const score = Number(location.risk_score) || 0;

                  return (
                    <tr key={location.location_id}>

                      <td data-label="Location">
                        <div className="location-name">
                          <span className="location-pin">📍</span>
                          <strong>{location.location_name}</strong>
                        </div>
                      </td>

                      <td data-label="Risk Score">

                        <div className="score-wrapper">

                          <div className="score-number">
                            {score.toFixed(2)}
                          </div>

                          <div className="score-bar">
                            <div
                              className={`score-fill ${getScoreClass(score)}`}
                              style={{
                                width: `${Math.min(score, 100)}%`,
                              }}
                            ></div>
                          </div>

                        </div>

                      </td>

                      <td data-label="Risk Level">
                        <span
                          className={`risk ${getRiskClass(
                            location.risk_level
                          )}`}
                        >
                          {location.risk_level}
                        </span>
                      </td>

                      <td data-label="Police">
                        <span className="number-badge">
                          {location.current_police}
                        </span>
                      </td>

                      <td data-label="Recommended">
                        <span className="recommended">
                          {location.recommended_police}
                        </span>
                      </td>

                      <td data-label="Coverage Gap">

                        <span
                          className={
                            location.coverage_gap > 0
                              ? "gap danger"
                              : "gap safe"
                          }
                        >
                          {location.coverage_gap > 0
                            ? `+${location.coverage_gap}`
                            : "✓ Covered"}
                        </span>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        </section>

      </main>

      <footer>
        <span>TrafficGuard AI</span>
        <span>•</span>
        <span>Real-Time Traffic Intelligence</span>
        <span>•</span>
        <span>Auto refresh: 3s</span>
      </footer>

    </div>
  );
}

export default App;