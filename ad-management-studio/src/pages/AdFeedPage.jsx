import React, { useEffect, useState } from "react";
import AdCard from "../components/AdCard";
import { fetchAllAds } from "../services/adService";

export default function AdFeedPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllAds();
      setAds(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Unable to connect to the ad service. Make sure the backend is running on localhost:8080.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">

      <div className="page-header">
        <h1>Ad Feed</h1>
        <p>Live advertisements from the database — click tracking flows through Redis → Kafka → ClickHouse</p>
      </div>

      <div className="feed-layout">

        <div className="feed-main">

          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={loadAds}>
              🔄 Refresh Ads
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => window.location.href = '/ads/manage'}>
              ➕ Add New Ad
            </button>
          </div>

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <span className="loading-text">Fetching ads from database...</span>
            </div>
          )}

          {error && (
            <div className="empty-state">
              <div className="empty-state-icon">⚠️</div>
              <div className="empty-state-title">Connection Error</div>
              <div className="empty-state-desc">{error}</div>
              <button className="btn btn-primary btn-sm" onClick={loadAds}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && ads.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📡</div>
              <div className="empty-state-title">No Ads Found</div>
              <div className="empty-state-desc">
                No advertisements in the database yet. Add some via the Ad Manager.
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => window.location.href = '/ads/manage'}>
                Go to Ad Manager
              </button>
            </div>
          )}

          {!loading && !error && ads.length > 0 && (
            <div className="ad-grid">
              {ads.map((ad, idx) => (
                <div key={ad.id || idx} className="animate-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                  <AdCard ad={ad} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="feed-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-card-title">Feed Overview</div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">Total Ads</span>
              <span className="sidebar-stat-value">{ads.length}</span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">Source</span>
              <span className="sidebar-stat-value">MySQL</span>
            </div>
          </div>

          <div className="sidebar-card">
            <div className="sidebar-card-title">Click Pipeline</div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">Dedup</span>
              <span className="sidebar-stat-value">Redis</span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">Stream</span>
              <span className="sidebar-stat-value">Kafka</span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">Analytics</span>
              <span className="sidebar-stat-value">ClickHouse</span>
            </div>
          </div>

          <div className="sidebar-card">
            <div className="sidebar-card-title">Endpoints</div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">GET</span>
              <span className="sidebar-stat-value" style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>
                /advertisments
              </span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-label">Click</span>
              <span className="sidebar-stat-value" style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>
                /click/adclick
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
