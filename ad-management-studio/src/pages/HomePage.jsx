import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { healthCheck } from "../services/adService";
import { analyticsHealthCheck, testClickHouse, fetchAllUserClickRates } from "../services/analyticsService";

export default function HomePage() {
  const navigate = useNavigate();

  const [services, setServices] = useState({
    adService: { status: "checking", message: "Checking..." },
    analyticsService: { status: "checking", message: "Checking..." },
    clickHouse: { status: "checking", message: "Checking..." },
  });

  const [stats, setStats] = useState({ totalClicks: 0, totalCost: 0, users: 0 });

  useEffect(() => {
    checkServices();
    loadStats();
  }, []);

  const checkServices = async () => {
    // Ad Service health
    try {
      const msg = await healthCheck();
      setServices(prev => ({ ...prev, adService: { status: "online", message: msg || "Running" } }));
    } catch {
      setServices(prev => ({ ...prev, adService: { status: "offline", message: "Unreachable" } }));
    }

    // Analytics service health
    try {
      const msg = await analyticsHealthCheck();
      setServices(prev => ({ ...prev, analyticsService: { status: "online", message: msg || "Running" } }));
    } catch {
      setServices(prev => ({ ...prev, analyticsService: { status: "offline", message: "Unreachable" } }));
    }

    // ClickHouse health
    try {
      const msg = await testClickHouse();
      setServices(prev => ({ ...prev, clickHouse: { status: "online", message: msg || "Connected" } }));
    } catch {
      setServices(prev => ({ ...prev, clickHouse: { status: "offline", message: "Unreachable" } }));
    }
  };

  const loadStats = async () => {
    try {
      const data = await fetchAllUserClickRates();
      if (Array.isArray(data) && data.length > 0) {
        const totalClicks = data.reduce((sum, u) => sum + (u.totalClicks || 0), 0);
        const totalCost = data.reduce((sum, u) => sum + (u.totalCost || 0), 0);
        setStats({ totalClicks, totalCost: totalCost.toFixed(2), users: data.length });
      }
    } catch {
      // Stats will stay at defaults
    }
  };

  return (
    <div className="page-container">
      <section className="hero-section" style={{ minHeight: 'auto', paddingBottom: '2rem' }}>

        <div className="hero-badge">
          <span className="badge-dot"></span>
          Real-Time Ad Intelligence
        </div>

        <h1 className="hero-title">
          Your <span>Ad Management</span><br />
          Command Center
        </h1>

        <p className="hero-subtitle">
          Monitor ad impressions, track clicks, analyze CTR performance,
          and run A/B experiments — all from a single, unified dashboard.
        </p>

        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => navigate("/feed")}>
            <span className="btn-icon">📡</span>
            Browse Ads
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/ads/manage")}>
            <span className="btn-icon">📦</span>
            Manage Ads
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/events")}>
            <span className="btn-icon">📊</span>
            Event Log
          </button>
        </div>
      </section>

      {/* Service Health */}
      <h2 className="section-title" style={{ marginTop: '1rem' }}>🩺 Service Health</h2>
      <div className="service-health-grid animate-in">
        <div className="health-card">
          <div className={`health-icon ${services.adService.status}`}>🖥️</div>
          <div className="health-info">
            <h4>Advertisements <span className={`status-text ${services.adService.status}`}></span></h4>

          </div>
        </div>
        <div className="health-card">
          <div className={`health-icon ${services.analyticsService.status}`}>📈</div>
          <div className="health-info">
            <h4>Analytics <span className={`status-text ${services.analyticsService.status}`}></span></h4>
            {/* <p>localhost:8086 — {services.analyticsService.message}</p> */}
          </div>
        </div>
        <div className="health-card">
          <div className={`health-icon ${services.clickHouse.status}`}>🗄️</div>
          <div className="health-info">
            <h4>Tracking <span className={`status-text ${services.clickHouse.status}`}></span></h4>
            {/* <p>{services.clickHouse.message}</p> */}
          </div>
        </div>
        <div className="health-card" style={{ cursor: 'pointer' }} onClick={checkServices}>
          <div className="health-icon checking">🔄</div>
          <div className="health-info">
            <h4>Model Monitoring</h4>

          </div>
        </div>
      </div>

      {/* Live Stats from ClickHouse */}
      <h2 className="section-title">📊 Analytics Summary</h2>
      <div className="hero-stats" style={{ maxWidth: '100%', marginTop: '0' }}>
        <div className="stat-card animate-in animate-in-delay-1">
          <div className="stat-value blue">{stats.totalClicks.toLocaleString()}</div>
          <div className="stat-label">Total Clicks</div>
        </div>
        <div className="stat-card animate-in animate-in-delay-2">
          <div className="stat-value purple">${stats.totalCost}</div>
          <div className="stat-label">Total Cost</div>
        </div>
        <div className="stat-card animate-in animate-in-delay-3">
          <div className="stat-value cyan">{stats.users}</div>
          <div className="stat-label">Active Users</div>
        </div>
      </div>

      {/* System flow */}
      <div className="flow-section" style={{ marginTop: '2.5rem' }}>
        <div className="flow-title">System Architecture</div>
        <div className="flow-diagram">
          <div className="flow-node"><span className="node-icon">⚛️</span> React</div>
          <span className="flow-arrow">→</span>
          <div className="flow-node"><span className="node-icon">🖥️</span> Ad Service</div>
          <span className="flow-arrow">→</span>
          <div className="flow-node"><span className="node-icon">📨</span> Kafka</div>
          <span className="flow-arrow">→</span>
          <div className="flow-node"><span className="node-icon">⚡</span> Flink</div>
          <span className="flow-arrow">→</span>
          <div className="flow-node"><span className="node-icon">🗄️</span> ClickHouse</div>
        </div>
      </div>
    </div>
  );
}