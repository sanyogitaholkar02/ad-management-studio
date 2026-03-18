import React, { useEffect, useState } from "react";
import AdCard from "../components/AdCard";
import { fetchAllAds, fetchAdSubscribers } from "../services/adService";

export default function AdFeedPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedAd, setSelectedAd] = useState(null);
  const [subsData, setSubsData] = useState(null);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subsError, setSubsError] = useState(null);

  const handleClickAd = async (ad) => {
    const adId = ad.adID || ad.adId || ad.id;
    const campaignId = ad.campaignId || ad.campaign_id;
    setSelectedAd(ad);
    setLoadingSubs(true);
    setSubsError(null);
    setSubsData(null);
    try {
      const data = await fetchAdSubscribers(adId, campaignId);
      setSubsData(data);
    } catch (err) {
      setSubsError(err.message);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleBackToAds = () => {
    setSelectedAd(null);
    setSubsData(null);
    setSubsError(null);
  };

  const filteredAds = ads.filter(ad => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (ad.company || "").toLowerCase().includes(q) ||
      (ad.adID || ad.adId || "").toLowerCase().includes(q) ||
      (ad.campaignId || "").toLowerCase().includes(q) ||
      (ad.category || "").toLowerCase().includes(q) ||
      (ad.description || "").toLowerCase().includes(q)
    );
  });

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
        {/* <p>Live advertisements from the database — click tracking flows through Redis → Kafka → ClickHouse</p> */}
      </div>

      <div className="feed-layout">

        <div className="feed-main">

          {/* Search */}
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="🔍  Search by company, ad ID, campaign, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
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

          {!loading && !error && ads.length > 0 && !selectedAd && (
            <>
              {filteredAds.length === 0 && search.trim() && (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">No matches</div>
                  <div className="empty-state-desc">
                    No ads match "{search}". Try a different search term.
                  </div>
                </div>
              )}
              <div className="ad-grid">
                {filteredAds.map((ad, idx) => (
                  <div key={ad.adID || ad.id || idx} className="animate-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <AdCard ad={ad} onClickAd={handleClickAd} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Subscriber Detail View */}
          {selectedAd && (
            <div className="animate-in">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleBackToAds}
                style={{ marginBottom: '1rem' }}
              >
                ← Back to Ads
              </button>

              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '50px', height: '50px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                    flexShrink: 0,
                  }}>
                    📢
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      {selectedAd.company || selectedAd.adID || 'Ad Details'}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {selectedAd.description || ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div className="ad-metric">
                    <span className="ad-metric-label">Ad ID</span>
                    <span className="ad-metric-value" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {selectedAd.adID || selectedAd.adId}
                    </span>
                  </div>
                  <div className="ad-metric">
                    <span className="ad-metric-label">Campaign</span>
                    <span className="ad-metric-value variant" style={{ fontSize: '0.85rem' }}>
                      {selectedAd.campaignId}
                    </span>
                  </div>
                  <div className="ad-metric">
                    <span className="ad-metric-label">Category</span>
                    <span className="ad-metric-value" style={{ fontSize: '0.85rem' }}>
                      {selectedAd.category || '—'}
                    </span>
                  </div>
                  <div className="ad-metric">
                    <span className="ad-metric-label">Platform</span>
                    <span className="ad-metric-value" style={{ fontSize: '0.85rem' }}>
                      {selectedAd.hostingPlatform || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscribers Section */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">👥 Ad Subscribers</span>
                  {subsData && (
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      padding: '4px 10px', borderRadius: '100px',
                      background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)',
                    }}>
                      {subsData.totalUsers} / 25 users
                    </span>
                  )}
                </div>

                {/* Donut Chart */}
                {subsData && !loadingSubs && !subsError && (() => {
                  const total = 46;
                  const count = subsData.totalUsers || 0;
                  const pct = Math.min((count / total) * 100, 100);
                  const radius = 54;
                  const circumference = 2 * Math.PI * radius;
                  const filled = (pct / 100) * circumference;
                  const empty = circumference - filled;

                  return (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '2rem', padding: '1.25rem 0', borderBottom: '1px solid var(--border-color)',
                    }}>
                      <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                        <svg viewBox="0 0 128 128" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                          {/* Background ring */}
                          <circle cx="64" cy="64" r={radius} fill="none"
                            stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                          {/* Filled arc */}
                          <circle cx="64" cy="64" r={radius} fill="none"
                            stroke="url(#donutGrad)" strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={`${filled} ${empty}`}
                            style={{
                              transition: 'stroke-dasharray 0.8s ease',
                            }}
                          />
                          <defs>
                            <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        {/* Center text */}
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {pct.toFixed(0)}%
                          </span>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            reach
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                            This Ad
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                            {count}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                            Total Users
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            46
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                            Remaining
                          </div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}>
                            {total - count}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {loadingSubs && (
                  <div className="loading-container" style={{ padding: '2rem' }}>
                    <div className="loading-spinner"></div>
                    <span className="loading-text">Fetching subscribers...</span>
                  </div>
                )}

                {subsError && (
                  <div style={{ padding: '1rem', fontSize: '0.85rem', color: '#ef4444' }}>
                    ⚠️ {subsError}
                  </div>
                )}

                {!loadingSubs && subsData && !subsError && (
                  <>
                    {subsData.userIds && subsData.userIds.length > 0 ? (
                      <table className="event-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>User ID</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subsData.userIds.map((uid, i) => (
                            <tr key={i}>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{i + 1}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{uid}</td>
                              <td>
                                <span className="event-type-badge click">clicked</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="empty-state" style={{ padding: '2rem' }}>
                        <div className="empty-state-icon">📭</div>
                        <div className="empty-state-title">No subscribers yet</div>
                        <div className="empty-state-desc">No users have clicked on this ad.</div>
                      </div>
                    )}
                  </>
                )}
              </div>
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
