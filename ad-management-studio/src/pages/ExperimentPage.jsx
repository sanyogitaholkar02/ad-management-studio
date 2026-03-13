import React, { useState, useEffect } from "react";
import {
  fetchAllUserClickRates,
  fetchUserClickRate,
  testClickHouse,
  submitFlinkJob,
} from "../services/analyticsService";

export default function ExperimentPage() {
  const [activeTab, setActiveTab] = useState("analytics");

  // Analytics state
  const [clickRates, setClickRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState(null);

  // User search
  const [searchUserId, setSearchUserId] = useState("");
  const [userResult, setUserResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // System actions
  const [chStatus, setChStatus] = useState(null);
  const [flinkStatus, setFlinkStatus] = useState(null);

  // Toast
  const [toasts, setToasts] = useState([]);
  const addToast = (type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => {
    loadClickRates();
  }, []);

  const loadClickRates = async () => {
    setLoadingRates(true);
    setRatesError(null);
    try {
      const raw = await fetchAllUserClickRates();
      // Normalize: API may return an array, a single object, or { data: [...] }
      let list;
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && typeof raw === "object" && Array.isArray(raw.data)) {
        list = raw.data;
      } else if (raw && typeof raw === "object" && raw.userId) {
        list = [raw]; // single user object → wrap in array
      } else {
        list = [];
      }
      setClickRates(list);
    } catch (err) {
      setRatesError("Failed to fetch click rates. Is the analytics service running on port 8086?");
    } finally {
      setLoadingRates(false);
    }
  };

  const handleUserSearch = async () => {
    if (!searchUserId.trim()) return;
    setSearchLoading(true);
    setUserResult(null);
    try {
      const data = await fetchUserClickRate(searchUserId.trim());
      setUserResult(data);
      addToast("success", `Found data for ${searchUserId}`);
    } catch (err) {
      setUserResult({ error: `No data found for user: ${searchUserId}` });
      addToast("error", "User not found or service error");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClickHouseTest = async () => {
    setChStatus("checking...");
    try {
      const result = await testClickHouse();
      setChStatus(result);
      addToast("success", "ClickHouse connectivity verified!");
    } catch {
      setChStatus("Connection failed");
      addToast("error", "ClickHouse unreachable");
    }
  };

  const handleFlinkJob = async () => {
    setFlinkStatus("submitting...");
    try {
      const result = await submitFlinkJob();
      setFlinkStatus(result);
      addToast("success", "Flink job submitted!");
    } catch {
      setFlinkStatus("Submission failed");
      addToast("error", "Failed to submit Flink job");
    }
  };

  // Compute summary stats
  const totalClicks = clickRates.reduce((sum, u) => sum + (u.totalClicks || 0), 0);
  const totalCost = clickRates.reduce((sum, u) => sum + (u.totalCost || 0), 0);
  const totalWindows = clickRates.reduce((sum, u) => sum + (u.windowsCount || 0), 0);

  return (
    <div className="page-container">

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-icon">
              {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}
            </span>
            <span className="toast-message">{t.message}</span>
          </div>
        ))}
      </div>

      <div className="page-header">
        <h1>Analytics & Experiments</h1>
        <p>ClickHouse analytics, user click-rate tracking, and Flink job management</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
          📊 Click Rate Analytics
        </button>
        <button className={`tab ${activeTab === "usersearch" ? "active" : ""}`} onClick={() => setActiveTab("usersearch")}>
          🔍 User Lookup
        </button>
        <button className={`tab ${activeTab === "system" ? "active" : ""}`} onClick={() => setActiveTab("system")}>
          ⚙️ System Actions
        </button>
      </div>

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="animate-in">

          {/* Summary */}
          <div className="event-log-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="event-summary-card">
              <div className="event-summary-icon clicks">🖱️</div>
              <div className="event-summary-data">
                <h3>{totalClicks.toLocaleString()}</h3>
                <p>Total Clicks (24h)</p>
              </div>
            </div>
            <div className="event-summary-card">
              <div className="event-summary-icon revenue">💰</div>
              <div className="event-summary-data">
                <h3>${totalCost.toFixed(2)}</h3>
                <p>Total Cost (24h)</p>
              </div>
            </div>
            <div className="event-summary-card">
              <div className="event-summary-icon impressions">👥</div>
              <div className="event-summary-data">
                <h3>{clickRates.length}</h3>
                <p>Active Users</p>
              </div>
            </div>
            <div className="event-summary-card">
              <div className="event-summary-icon ctr">📈</div>
              <div className="event-summary-data">
                <h3>{totalWindows}</h3>
                <p>Time Windows</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={loadClickRates}>
              🔄 Refresh Data
            </button>
          </div>

          {loadingRates && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <span className="loading-text">Querying ClickHouse...</span>
            </div>
          )}

          {ratesError && (
            <div className="empty-state">
              <div className="empty-state-icon">⚠️</div>
              <div className="empty-state-title">Connection Error</div>
              <div className="empty-state-desc">{ratesError}</div>
              <button className="btn btn-primary btn-sm" onClick={loadClickRates}>Retry</button>
            </div>
          )}

          {!loadingRates && !ratesError && clickRates.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">No Click Rate Data</div>
              <div className="empty-state-desc">
                No analytics data in ClickHouse yet. Produce some click events first!
              </div>
            </div>
          )}

          {!loadingRates && !ratesError && clickRates.length > 0 && (
            <div className="event-table-wrapper">
              <div className="event-table-header">
                <span className="event-table-title">User Click Rates — Last 24 Hours</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  GET /api/analytics/hardcode/user-click-rate-24h
                </span>
              </div>
              <table className="event-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Total Clicks</th>
                    <th>Total Cost</th>
                    <th>Windows</th>
                    <th>First Window</th>
                    <th>Last Window</th>
                  </tr>
                </thead>
                <tbody>
                  {clickRates.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.userId || "—"}
                      </td>
                      <td>
                        <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                          {(row.totalClicks || 0).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--accent-amber)' }}>
                          ${(row.totalCost || 0).toFixed(2)}
                        </span>
                      </td>
                      <td>{row.windowsCount || 0}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {row.firstWindow || "—"}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {row.lastWindow || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* USER SEARCH TAB */}
      {activeTab === "usersearch" && (
        <div className="animate-in">
          <div className="search-bar">
            <input
              className="form-input mono"
              placeholder="Enter user ID (e.g. user-001)"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUserSearch()}
            />
            <button className="btn btn-primary" onClick={handleUserSearch} disabled={searchLoading}>
              {searchLoading ? "Searching..." : "🔍 Search"}
            </button>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            GET /api/analytics/hardcode/user-click-rate-24h/&#123;userId&#125; — Query ClickHouse for a specific user's click rate data
          </p>

          {userResult && !userResult.error && (
            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-card-header">
                  <span className="analytics-card-title">Total Clicks</span>
                  <span>🖱️</span>
                </div>
                <div className="analytics-card-value" style={{ color: 'var(--accent-blue)' }}>
                  {(userResult.totalClicks || 0).toLocaleString()}
                </div>
                <div className="analytics-card-sub">In the last 24 hours</div>
              </div>

              <div className="analytics-card">
                <div className="analytics-card-header">
                  <span className="analytics-card-title">Total Cost</span>
                  <span>💰</span>
                </div>
                <div className="analytics-card-value" style={{ color: 'var(--accent-amber)' }}>
                  ${(userResult.totalCost || 0).toFixed(2)}
                </div>
                <div className="analytics-card-sub">Aggregated spend</div>
              </div>

              <div className="analytics-card">
                <div className="analytics-card-header">
                  <span className="analytics-card-title">Time Windows</span>
                  <span>🕐</span>
                </div>
                <div className="analytics-card-value" style={{ color: 'var(--accent-purple)' }}>
                  {userResult.windowsCount || 0}
                </div>
                <div className="analytics-card-sub">
                  {userResult.firstWindow || "—"} → {userResult.lastWindow || "—"}
                </div>
              </div>

              <div className="analytics-card">
                <div style={{ marginBottom: '0.75rem' }}>
                  <span className="analytics-card-title">Raw Response</span>
                </div>
                <div className="json-block">
                  {JSON.stringify(userResult, null, 2)}
                </div>
              </div>
            </div>
          )}

          {userResult && userResult.error && (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">Not Found</div>
              <div className="empty-state-desc">{userResult.error}</div>
            </div>
          )}
        </div>
      )}

      {/* SYSTEM ACTIONS TAB */}
      {activeTab === "system" && (
        <div className="animate-in">
          <div className="analytics-grid">

            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">🗄️ Test ClickHouse</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                GET /api/analytics/clickhouse-test — Verify ClickHouse connectivity
              </p>
              <button className="btn btn-primary btn-sm" onClick={handleClickHouseTest}>
                Test Connection
              </button>
              {chStatus && (
                <div className="json-block" style={{ marginTop: '1rem' }}>{chStatus}</div>
              )}
            </div>

            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">⚡ Submit Flink Job</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                GET /submit-job — Submit a test Flink streaming job
              </p>
              <button className="btn btn-primary btn-sm" onClick={handleFlinkJob}>
                Submit Job
              </button>
              {flinkStatus && (
                <div className="json-block" style={{ marginTop: '1rem' }}>{flinkStatus}</div>
              )}
            </div>

            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">📡 API Health</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                GET /api/data — Check analytics service health
              </p>
              <div className="json-block">
                {`Endpoints:
  GET   Submit-Job
  GET   Data (Health)
  GET   Ad-Aggregates
  POST  Kafka-Produce
  GET   Kafka-Test
  GET   ClickHouse-Test
  GET   User-Click-Rate-24h
  GET   User-Click-Rate-24h/{userId}`}
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-header">
                <span className="analytics-card-title">🖥️ Ad Service</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Advertisements CRUD + Click Tracking
              </p>
              <div className="json-block">
                {`
Endpoints:
  GET   All-Ads
  POST  Add-Ad
  POST  Add-List (Bulk)
  POST  Upload-Image
  POST  Ad-Click`}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}