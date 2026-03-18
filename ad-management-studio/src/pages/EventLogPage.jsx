import React, { useState, useEffect } from "react";
import {
    fetchAdAggregates,
    produceAdClickEvent,
    sendKafkaTestMessage,
} from "../services/analyticsService";
import { recordAdClick } from "../services/adService";

export default function EventLogPage() {
    const [activeTab, setActiveTab] = useState("producer");
    const [aggregates, setAggregates] = useState([]);
    const [loadingAgg, setLoadingAgg] = useState(false);
    const [aggError, setAggError] = useState(null);

    // Kafka producer form state
    const [form, setForm] = useState({
        adId: "ad-001",
        campaignId: "camp-100",
        userId: "user-001",
        idempotencyKey: `key-${Date.now()}`,
        timestamp: new Date().toISOString(),
        cost: "1.50",
        redirectUrl: "https://example.com/ad-001",
    });
    const [producing, setProducing] = useState(false);
    const [produceResult, setProduceResult] = useState(null);
    const [adClickResult, setAdClickResult] = useState(null);
    const [testResult, setTestResult] = useState(null);

    // Toast
    const [toasts, setToasts] = useState([]);
    const addToast = (type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    useEffect(() => {
        if (activeTab === "aggregates") loadAggregates();
    }, [activeTab]);

    const loadAggregates = async () => {
        setLoadingAgg(true);
        setAggError(null);
        try {
            const data = await fetchAdAggregates();
            setAggregates(Array.isArray(data) ? data : [data]);
        } catch (err) {
            setAggError("Failed to fetch aggregates. Is the analytics service running on port 8086?");
        } finally {
            setLoadingAgg(false);
        }
    };

    const handleProduce = async () => {
        setProducing(true);
        setProduceResult(null);
        setAdClickResult(null);
        try {
            const payload = {
                ...form,
                cost: parseFloat(form.cost) || 0,
            };

            // 1. POST /events/adclick — Redis dedup → Kafka → redirect
            try {
                const clickResult = await recordAdClick({
                    adId: form.adId,
                    campaignId: form.campaignId,
                    userId: form.userId,
                    idempotencyKey: form.idempotencyKey,
                    timestamp: Date.now(),
                    redirectUrl: form.redirectUrl,
                });
                setAdClickResult(JSON.stringify(clickResult, null, 2));
                addToast("success", "POST /events/adclick — Click event processed!");
            } catch (clickErr) {
                setAdClickResult("Error: " + clickErr.message);
                addToast("error", "/events/adclick failed: " + clickErr.message);
            }

            // 2. POST /kafka-produce — direct Kafka produce via analytics service
            const result = await produceAdClickEvent(payload);
            setProduceResult(result);
            addToast("success", "POST /kafka-produce — Event produced to Kafka!");

            // Generate new idempotency key for next event
            setForm(prev => ({
                ...prev,
                idempotencyKey: `key-${Date.now()}`,
                timestamp: new Date().toISOString(),
            }));
        } catch (err) {
            setProduceResult("Error: " + err.message);
            addToast("error", "Failed to produce event: " + err.message);
        } finally {
            setProducing(false);
        }
    };

    const handleTestMessage = async () => {
        setTestResult(null);
        try {
            const result = await sendKafkaTestMessage();
            setTestResult(result);
            addToast("success", "Test message sent to Kafka!");
        } catch (err) {
            setTestResult("Error: " + err.message);
            addToast("error", "Failed to send test message");
        }
    };

    const handleFormChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

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
                <h1>Event Log</h1>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === "producer" ? "active" : ""}`}
                    onClick={() => setActiveTab("producer")}
                >
                    📨 Producer Click Event
                </button>
                <button
                    className={`tab ${activeTab === "aggregates" ? "active" : ""}`}
                    onClick={() => setActiveTab("aggregates")}
                >
                    📊 Ad Aggregates
                </button>
            </div>

            {/* KAFKA PRODUCER TAB */}
            {activeTab === "producer" && (
                <div className="kafka-producer-layout animate-in">

                    <div className="kafka-form-panel">
                        <h3>📨 Produce Ad Click Event</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                            POST /kafka-produce — Send an AdClick event to the Kafka topic
                        </p>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Ad ID</label>
                                <input className="form-input mono" name="adId" value={form.adId} onChange={handleFormChange} placeholder="ad-123" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Campaign ID</label>
                                <input className="form-input mono" name="campaignId" value={form.campaignId} onChange={handleFormChange} placeholder="camp-456" />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">User ID</label>
                                <input className="form-input mono" name="userId" value={form.userId} onChange={handleFormChange} placeholder="user-789" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cost ($)</label>
                                <input className="form-input mono" name="cost" value={form.cost} onChange={handleFormChange} placeholder="2.50" type="number" step="0.01" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Idempotency Key</label>
                            <input className="form-input mono" name="idempotencyKey" value={form.idempotencyKey} onChange={handleFormChange} placeholder="key-001" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Timestamp</label>
                            <input className="form-input mono" name="timestamp" value={form.timestamp} onChange={handleFormChange} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Redirect URL</label>
                            <input className="form-input mono" name="redirectUrl" value={form.redirectUrl} onChange={handleFormChange} placeholder="https://example.com" />
                        </div>

                        <div className="form-actions">
                            <button className="btn btn-primary" onClick={handleProduce} disabled={producing}>
                                {producing ? "Sending..." : "🚀 Produce Event"}
                            </button>
                            <button className="btn btn-secondary" onClick={handleTestMessage}>
                                🧪 Send Test Message
                            </button>
                        </div>
                    </div>

                    <div className="kafka-results-panel">
                        <h3>📋 Response</h3>

                        {adClickResult && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div className="form-label" style={{ marginBottom: '0.5rem' }}>POST /events/adclick Result</div>
                                <div className="json-block">{adClickResult}</div>
                            </div>
                        )}

                        {produceResult && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div className="form-label" style={{ marginBottom: '0.5rem' }}>POST /kafka-produce Result</div>
                                <div className="json-block">{produceResult}</div>
                            </div>
                        )}

                        {testResult && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div className="form-label" style={{ marginBottom: '0.5rem' }}>Test Message Result</div>
                                <div className="json-block">{testResult}</div>
                            </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            <div className="form-label" style={{ marginBottom: '0.5rem' }}>Request Preview</div>
                            <div className="json-block">
                                {JSON.stringify({
                                    ...form,
                                    cost: parseFloat(form.cost) || 0
                                }, null, 2)}
                            </div>
                        </div>

                        <div>
                            <div className="form-label" style={{ marginBottom: '0.5rem' }}>Endpoint Info</div>
                            <div className="json-block">
                                {`1. POST /events/adclick (Ad Processor :8085)
   → Redis dedup → Kafka publish → 302 redirect

2. POST /kafka-produce (Analytics :8086)
   → Direct Kafka produce → Flink → ClickHouse`}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AD AGGREGATES TAB */}
            {activeTab === "aggregates" && (
                <div className="animate-in">
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={loadAggregates}>
                            🔄 Refresh Aggregates
                        </button>
                    </div>

                    {loadingAgg && (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <span className="loading-text">Fetching Kafka aggregates...</span>
                        </div>
                    )}

                    {aggError && (
                        <div className="empty-state">
                            <div className="empty-state-icon">⚠️</div>
                            <div className="empty-state-title">Connection Error</div>
                            <div className="empty-state-desc">{aggError}</div>
                            <button className="btn btn-primary btn-sm" onClick={loadAggregates}>Retry</button>
                        </div>
                    )}

                    {!loadingAgg && !aggError && aggregates.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">📭</div>
                            <div className="empty-state-title">No Aggregates Yet</div>
                            <div className="empty-state-desc">
                                No consumed Kafka messages found. Produce some events first!
                            </div>
                        </div>
                    )}

                    {!loadingAgg && !aggError && aggregates.length > 0 && (
                        <>
                            <div className="event-table-wrapper">
                                <div className="event-table-header">
                                    <span className="event-table-title">Consumed Kafka Messages</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        GET /ad-aggregates • {aggregates.length} entries
                                    </span>
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    {aggregates.map((agg, idx) => (
                                        <div key={idx} className="json-block" style={{ marginBottom: idx < aggregates.length - 1 ? '0.75rem' : 0 }}>
                                            {JSON.stringify(agg, null, 2)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

        </div>
    );
}
