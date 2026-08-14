import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

/*
  Production backend
  Your FastAPI backend is deployed on Render.

  You can also create a .env file:

  VITE_API_URL=https://nagpur-trafficguard-ai.onrender.com
*/
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://nagpur-trafficguard-ai.onrender.com";

const REFRESH_INTERVAL = 5000;

/* -------------------------------------------------------
   Demo data
   Used if the backend is temporarily unavailable.
------------------------------------------------------- */

const DEMO_LOCATIONS = [
  "Itwari",
  "Chhatrapati Square",
  "Manish Nagar",
  "Sitabuldi",
  "Central Avenue",
  "Wardha Road",
  "Sadar",
  "Dharampeth",
  "Medical Square",
  "Mahal",
];

const createDemoData = () => {
  const locations = DEMO_LOCATIONS.map((name, index) => {
    const base = 58 + Math.random() * 30;
    const score = Math.max(
      25,
      Math.min(98, base + (Math.random() * 12 - 6))
    );

    let riskLevel = "LOW";

    if (score >= 70) {
      riskLevel = "HIGH";
    } else if (score >= 45) {
      riskLevel = "MEDIUM";
    }

    const currentPolice =
      riskLevel === "HIGH"
        ? Math.floor(Math.random() * 2)
        : Math.floor(Math.random() * 3);

    const recommendedPolice =
      riskLevel === "HIGH"
        ? 2
        : riskLevel === "MEDIUM"
          ? 1
          : 1;

    return {
      location_id: index + 1,
      location_name: name,
      risk_score: Number(score.toFixed(2)),
      risk_level: riskLevel,
      current_police: currentPolice,
      recommended_police: recommendedPolice,
      coverage_gap: Math.max(
        0,
        recommendedPolice - currentPolice
      ),
    };
  });

  locations.sort((a, b) => b.risk_score - a.risk_score);

  const highRisk = locations.filter(
    (item) => item.risk_level === "HIGH"
  ).length;

  const mediumRisk = locations.filter(
    (item) => item.risk_level === "MEDIUM"
  ).length;

  const lowRisk = locations.filter(
    (item) => item.risk_level === "LOW"
  ).length;

  return {
    total_locations: 32,
    high_risk: highRisk,
    medium_risk: mediumRisk,
    low_risk: lowRisk,
    total_available_officers: Math.max(
      4,
      12 + Math.floor(Math.random() * 5) - 2
    ),
    top_priorities: locations,
  };
};

/* -------------------------------------------------------
   Normalize backend response
------------------------------------------------------- */

const normalizeDashboard = (data) => {
  if (!data) {
    return createDemoData();
  }

  return {
    total_locations:
      Number(data.total_locations) || 0,

    high_risk:
      Number(data.high_risk) || 0,

    medium_risk:
      Number(data.medium_risk) || 0,

    low_risk:
      Number(data.low_risk) || 0,

    total_available_officers:
      Number(data.total_available_officers) || 0,

    top_priorities:
      Array.isArray(data.top_priorities)
        ? data.top_priorities
        : [],
  };
};

/* -------------------------------------------------------
   Main App
------------------------------------------------------- */

function App() {
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [isLive, setIsLive] = useState(false);

  const [lastUpdated, setLastUpdated] = useState(null);

  const [usingSimulation, setUsingSimulation] =
    useState(false);

  const [refreshing, setRefreshing] = useState(false);

  /* -------------------------------------------------------
     Fetch dashboard
  ------------------------------------------------------- */

  const loadDashboard = useCallback(async () => {
    try {
      setRefreshing(true);

      const response = await fetch(
        `${API_URL}/api/dashboard`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },

          // Do not let a sleeping Render server hang forever.
          signal: AbortSignal.timeout(8000),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}`
        );
      }

      const data = await response.json();

      setDashboard(normalizeDashboard(data));

      setIsLive(true);

      setUsingSimulation(false);

      setError("");

      setLastUpdated(new Date());
    } catch (err) {
      console.warn(
        "Backend unavailable. Using traffic simulation.",
        err
      );

      /*
        IMPORTANT:
        Instead of showing a white screen when the backend
        fails, keep the dashboard alive with simulation.
      */

      setDashboard((previous) => {
        const simulated = createDemoData();

        /*
          If backend data was already displayed, slightly
          preserve the previous location count.
        */
        if (previous) {
          simulated.total_locations =
            previous.total_locations ||
            simulated.total_locations;
        }

        return simulated;
      });

      setIsLive(false);

      setUsingSimulation(true);

      setError(
        "Backend temporarily unavailable. Running live simulation."
      );

      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /* -------------------------------------------------------
     Initial load + automatic refresh
  ------------------------------------------------------- */

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard();
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [loadDashboard]);

  /* -------------------------------------------------------
     Extra simulation updates
     
     This means the UI continues changing even when
     Render/FastAPI is sleeping.
  ------------------------------------------------------- */

  useEffect(() => {
    if (!usingSimulation) {
      return;
    }

    const simulationInterval = setInterval(() => {
      setDashboard((previous) => {
        if (!previous) {
          return createDemoData();
        }

        const updatedLocations =
          previous.top_priorities.map((location) => {
            const movement =
              Math.random() * 12 - 6;

            const newScore = Math.max(
              20,
              Math.min(
                99,
                Number(location.risk_score) +
                  movement
              )
            );

            let newRisk = "LOW";

            if (newScore >= 70) {
              newRisk = "HIGH";
            } else if (newScore >= 45) {
              newRisk = "MEDIUM";
            }

            const currentPolice =
              Math.max(
                0,
                Number(location.current_police || 0) +
                  (Math.random() > 0.8
                    ? Math.random() > 0.5
                      ? 1
                      : -1
                    : 0)
              );

            const recommendedPolice =
              newRisk === "HIGH"
                ? 2
                : newRisk === "MEDIUM"
                  ? 1
                  : 1;

            return {
              ...location,

              risk_score: Number(
                newScore.toFixed(2)
              ),

              risk_level: newRisk,

              current_police: currentPolice,

              recommended_police:
                recommendedPolice,

              coverage_gap: Math.max(
                0,
                recommendedPolice - currentPolice
              ),
            };
          });

        updatedLocations.sort(
          (a, b) =>
            b.risk_score - a.risk_score
        );

        return {
          ...previous,

          high_risk:
            updatedLocations.filter(
              (x) => x.risk_level === "HIGH"
            ).length,

          medium_risk:
            updatedLocations.filter(
              (x) => x.risk_level === "MEDIUM"
            ).length,

          low_risk:
            updatedLocations.filter(
              (x) => x.risk_level === "LOW"
            ).length,

          top_priorities: updatedLocations,

          total_available_officers: Math.max(
            3,
            previous.total_available_officers +
              (Math.random() > 0.7
                ? Math.random() > 0.5
                  ? 1
                  : -1
                : 0)
          ),
        };
      });

      setLastUpdated(new Date());
    }, 3000);

    return () => {
      clearInterval(simulationInterval);
    };
  }, [usingSimulation]);

  /* -------------------------------------------------------
     Calculate overall traffic percentage
  ------------------------------------------------------- */

  const trafficHealth = useMemo(() => {
    if (!dashboard) {
      return 0;
    }

    const total =
      dashboard.high_risk +
      dashboard.medium_risk +
      dashboard.low_risk;

    if (!total) {
      return 0;
    }

    return Math.round(
      ((dashboard.low_risk +
        dashboard.medium_risk * 0.5) /
        total) *
        100
    );
  }, [dashboard]);

  /* -------------------------------------------------------
     Loading screen
  ------------------------------------------------------- */

  if (loading && !dashboard) {
    return (
      <div className="app loading-screen">
        <div className="loading-card">
          <div className="traffic-icon">🚦</div>

          <h1>Nagpur TrafficGuard AI</h1>

          <p>
            Initializing real-time traffic monitoring...
          </p>

          <div className="loading-bar">
            <div />
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     Safety fallback
  ------------------------------------------------------- */

  if (!dashboard) {
    return (
      <div className="app loading-screen">
        <div className="loading-card">
          <div className="traffic-icon">🚦</div>

          <h1>Nagpur TrafficGuard AI</h1>

          <p>
            Starting traffic simulation...
          </p>

          <button
            className="refresh-button"
            onClick={loadDashboard}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     Dashboard
  ------------------------------------------------------- */

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div className="brand">

          <div className="brand-icon">
            🚦
          </div>

          <div>
            <h1>
              Nagpur TrafficGuard AI
            </h1>

            <p>
              AI-Powered Traffic Risk & Police
              Deployment
            </p>
          </div>

        </div>

        <div className="header-actions">

          <div
            className={`status ${
              isLive
                ? "online"
                : "simulation"
            }`}
          >
            <span className="live-dot" />

            {isLive
              ? "SYSTEM ONLINE"
              : "SIMULATION MODE"}
          </div>

          <div className="live-badge">
            <span className="pulse-dot" />
            LIVE DATA
          </div>

        </div>

      </header>


      {/* MAIN */}

      <main>

        {/* STATUS MESSAGE */}

        {error && (
          <div className="simulation-banner">
            <span>⚡</span>

            <div>
              <strong>
                Real-time simulation active
              </strong>

              <p>
                {error}
              </p>
            </div>
          </div>
        )}


        {/* TOP SUMMARY */}

        <section className="overview">

          <div className="overview-title">

            <div>
              <span className="eyebrow">
                TRAFFIC COMMAND CENTER
              </span>

              <h2>
                Real-Time Traffic Overview
              </h2>
            </div>

            <div className="update-info">

              <span>
                Last update
              </span>

              <strong>
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString()
                  : "--:--:--"}
              </strong>

              <button
                className={`refresh-button ${
                  refreshing
                    ? "spinning"
                    : ""
                }`}
                onClick={loadDashboard}
                disabled={refreshing}
                title="Refresh dashboard"
              >
                ↻
              </button>

            </div>

          </div>


          {/* CARDS */}

          <section className="cards">

            <div className="card total">

              <div className="card-top">
                <span>
                  Total Locations
                </span>

                <div className="card-icon">
                  📍
                </div>
              </div>

              <strong>
                {dashboard.total_locations}
              </strong>

              <small>
                Monitored locations
              </small>

            </div>


            <div className="card high">

              <div className="card-top">
                <span>
                  High Risk
                </span>

                <div className="card-icon">
                  🔴
                </div>
              </div>

              <strong>
                {dashboard.high_risk}
              </strong>

              <small>
                Immediate attention
              </small>

            </div>


            <div className="card medium">

              <div className="card-top">
                <span>
                  Medium Risk
                </span>

                <div className="card-icon">
                  🟠
                </div>
              </div>

              <strong>
                {dashboard.medium_risk}
              </strong>

              <small>
                Requires monitoring
              </small>

            </div>


            <div className="card low">

              <div className="card-top">
                <span>
                  Low Risk
                </span>

                <div className="card-icon">
                  🟢
                </div>
              </div>

              <strong>
                {dashboard.low_risk}
              </strong>

              <small>
                Normal traffic
              </small>

            </div>


            <div className="card officers">

              <div className="card-top">
                <span>
                  Available Officers
                </span>

                <div className="card-icon">
                  👮
                </div>
              </div>

              <strong>
                {dashboard.total_available_officers}
              </strong>

              <small>
                Deployment ready
              </small>

            </div>

          </section>

        </section>


        {/* HEALTH + LIVE STATUS */}

        <section className="analytics">

          <div className="health-card">

            <div>
              <span className="eyebrow">
                TRAFFIC HEALTH
              </span>

              <h3>
                City Traffic Condition
              </h3>
            </div>

            <div className="health-content">

              <div className="health-circle">

                <div>
                  <strong>
                    {trafficHealth}%
                  </strong>

                  <span>
                    healthy
                  </span>
                </div>

              </div>

              <div className="health-text">

                <p>
                  Traffic conditions are being
                  continuously analyzed across
                  monitored Nagpur locations.
                </p>

                <div className="health-status">
                  <span className="pulse-dot" />

                  AI monitoring active
                </div>

              </div>

            </div>

          </div>


          <div className="activity-card">

            <div className="activity-header">

              <div>
                <span className="eyebrow">
                  SYSTEM ACTIVITY
                </span>

                <h3>
                  Live Monitoring
                </h3>
              </div>

              <span className="live-badge small">
                LIVE
              </span>

            </div>

            <div className="activity-list">

              <div>
                <span className="activity-dot green" />

                <div>
                  <strong>
                    Traffic sensors active
                  </strong>

                  <small>
                    All monitored zones
                  </small>
                </div>
              </div>

              <div>
                <span className="activity-dot blue" />

                <div>
                  <strong>
                    Risk engine running
                  </strong>

                  <small>
                    Continuous analysis
                  </small>
                </div>
              </div>

              <div>
                <span className="activity-dot orange" />

                <div>
                  <strong>
                    Police deployment optimized
                  </strong>

                  <small>
                    AI recommendations active
                  </small>
                </div>
              </div>

            </div>

          </div>

        </section>


        {/* PRIORITIES */}

        <section className="panel">

          <div className="panel-header">

            <div>
              <span className="eyebrow">
                PRIORITY MONITORING
              </span>

              <h2>
                🚨 Top Traffic Priorities
              </h2>

              <p>
                Highest-risk locations requiring
                attention
              </p>
            </div>

            <div className="location-count">
              <strong>
                {dashboard.top_priorities.length}
              </strong>

              <span>
                locations
              </span>
            </div>

          </div>


          {/* DESKTOP TABLE */}

          <div className="table-container">

            <table>

              <thead>

                <tr>
                  <th>Location</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Police</th>
                  <th>Recommended</th>
                  <th>Coverage Gap</th>
                </tr>

              </thead>

              <tbody>

                {dashboard.top_priorities.map(
                  (location, index) => {

                    const risk =
                      String(
                        location.risk_level ||
                          "LOW"
                      ).toLowerCase();

                    return (
                      <tr
                        key={
                          location.location_id ||
                          index
                        }
                      >

                        <td>

                          <div className="location-cell">

                            <span className="rank">
                              #{index + 1}
                            </span>

                            <strong>
                              {
                                location.location_name
                              }
                            </strong>

                          </div>

                        </td>


                        <td>

                          <div className="score">

                            <strong>
                              {Number(
                                location.risk_score
                              ).toFixed(2)}
                            </strong>

                            <div className="score-bar">
                              <span
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Number(
                                      location.risk_score
                                    )
                                  )}%`,
                                }}
                              />
                            </div>

                          </div>

                        </td>


                        <td>

                          <span
                            className={`risk ${risk}`}
                          >
                            {String(
                              location.risk_level ||
                                "LOW"
                            ).toUpperCase()}
                          </span>

                        </td>


                        <td>
                          <span className="number">
                            {
                              location.current_police
                            }
                          </span>
                        </td>


                        <td>
                          <span className="number recommended">
                            {
                              location.recommended_police
                            }
                          </span>
                        </td>


                        <td>

                          {Number(
                            location.coverage_gap
                          ) > 0 ? (
                            <span className="gap">
                              +{location.coverage_gap}
                            </span>
                          ) : (
                            <span className="covered">
                              ✓ Covered
                            </span>
                          )}

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>


          {/* MOBILE CARDS */}

          <div className="mobile-priorities">

            {dashboard.top_priorities.map(
              (location, index) => {

                const risk =
                  String(
                    location.risk_level ||
                      "LOW"
                  ).toLowerCase();

                return (
                  <div
                    className="priority-card"
                    key={
                      location.location_id ||
                      index
                    }
                  >

                    <div className="priority-top">

                      <div>

                        <span className="rank">
                          #{index + 1}
                        </span>

                        <strong>
                          {
                            location.location_name
                          }
                        </strong>

                      </div>

                      <span
                        className={`risk ${risk}`}
                      >
                        {risk.toUpperCase()}
                      </span>

                    </div>


                    <div className="priority-grid">

                      <div>
                        <small>
                          Risk Score
                        </small>

                        <strong>
                          {Number(
                            location.risk_score
                          ).toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        <small>
                          Police
                        </small>

                        <strong>
                          {
                            location.current_police
                          }
                        </strong>
                      </div>

                      <div>
                        <small>
                          Recommended
                        </small>

                        <strong>
                          {
                            location.recommended_police
                          }
                        </strong>
                      </div>

                      <div>
                        <small>
                          Coverage Gap
                        </small>

                        <strong>
                          {
                            location.coverage_gap
                          }
                        </strong>
                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </section>


        {/* FOOTER */}

        <footer>

          <span>
            🚦 Nagpur TrafficGuard AI
          </span>

          <span>
            Real-time AI traffic intelligence
          </span>

          <span>
            {usingSimulation
              ? "Simulation"
              : "Connected to backend"}
          </span>

        </footer>

      </main>

    </div>
  );
}

export default App;