import React, { useState, useEffect, useRef } from "react";
import { predictCtr, predictCtrByUser, batchPredictCtr, getVariant } from "../services/ctrService";
import { fetchAllUserClickRates } from "../services/analyticsService";

const DEVICES = ["mobile", "desktop", "tablet"];
const COUNTRIES = ["US", "UK", "IN", "DE", "CA", "AU", "JP", "BR", "FR", "SG"];

export default function CtrPredictionPage() {
    const [activeTab, setActiveTab] = useState("predict");
    const [predictSubTab, setPredictSubTab] = useState("single");

    // ── User ID search ──
    const [userIds, setUserIds] = useState([]);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const userDropdownRef = useRef(null);

    useEffect(() => {
        fetchAllUserClickRates()
            .then(data => {
                const list = Array.isArray(data) ? data : data?.data ? data.data : [data];
                const ids = list.map(u => u.userId).filter(Boolean);
                setUserIds(ids.length > 0 ? ids : [
                    "user-1", "user-2", "user-5", "user-10", "user-15",
                    "user-20", "user-25", "user-30", "user-42", "user-50",
                    "user-75", "user-99", "user-100"
                ]);
            })
            .catch(() => {
                setUserIds([
                    "user-1", "user-2", "user-5", "user-10", "user-15",
                    "user-20", "user-25", "user-30", "user-42", "user-50",
                    "user-75", "user-99", "user-100"
                ]);
            });

        // Close dropdown on outside click
        const handleOutsideClick = (e) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // ── Single Predict ──
    const [predictForm, setPredictForm] = useState({
        user_id: "",
        ad_id: "",

        device: "mobile",
        country: "US",
        hour: new Date().getHours(),
    });
    const [predicting, setPredicting] = useState(false);
    const [predictionResult, setPredictionResult] = useState(null);
    const [predictError, setPredictError] = useState(null);

    // ── Batch Predict ──
    const [batchForm, setBatchForm] = useState({
        user_id: "",
        ad_ids_str: "ad-001, ad-002, ad-003",
        device: "mobile",
        country: "US",
        hour: new Date().getHours(),
    });
    const [batchRunning, setBatchRunning] = useState(false);
    const [batchResults, setBatchResults] = useState([]);
    const [batchError, setBatchError] = useState(null);

    // ── A/B Testing ──
    const [abUserId, setAbUserId] = useState("");
    const [abLoading, setAbLoading] = useState(false);
    const [abVariant, setAbVariant] = useState(null);
    const [abError, setAbError] = useState(null);

    // ── Full Flow Simulation ──
    const [flowUserId, setFlowUserId] = useState("");
    const [flowAdIds, setFlowAdIds] = useState("ad-101, ad-102, ad-103");
    const [flowRunning, setFlowRunning] = useState(false);
    const [flowSteps, setFlowSteps] = useState([]);

    // ── Toast ──
    const [toasts, setToasts] = useState([]);
    const addToast = (type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    // ── Handlers ──

    const handlePredict = async () => {
        if (!predictForm.user_id) {
            addToast("error", "User ID is required");
            return;
        }
        setPredicting(true);
        setPredictionResult(null);
        setPredictError(null);
        try {
            const data = await predictCtrByUser(predictForm.user_id);
            setPredictionResult(data);
            addToast("success", `Predicted ads for ${predictForm.user_id}`);
        } catch (err) {
            setPredictError(err.message);
            addToast("error", "Prediction failed: " + err.message);
        } finally {
            setPredicting(false);
        }
    };

    const handleBatchPredict = async () => {
        if (!batchForm.user_id) {
            addToast("error", "User ID is required");
            return;
        }
        const ad_ids = batchForm.ad_ids_str.split(",").map(s => s.trim()).filter(Boolean);
        if (ad_ids.length === 0) {
            addToast("error", "Enter at least one Ad ID");
            return;
        }
        setBatchRunning(true);
        setBatchResults([]);
        setBatchError(null);
        try {
            const results = await batchPredictCtr({
                user_id: batchForm.user_id,
                ad_ids,
                device: batchForm.device,
                country: batchForm.country,
                hour: parseInt(batchForm.hour, 10),
            });
            setBatchResults(Array.isArray(results) ? results : []);
            addToast("success", `Batch complete: ${Array.isArray(results) ? results.length : 0} predictions`);
        } catch (err) {
            setBatchError(err.message);
            addToast("error", "Batch prediction failed: " + err.message);
        } finally {
            setBatchRunning(false);
        }
    };

    const handleVariantLookup = async () => {
        if (!abUserId.trim()) {
            addToast("error", "User ID is required");
            return;
        }
        setAbLoading(true);
        setAbVariant(null);
        setAbError(null);
        try {
            const data = await getVariant(abUserId.trim());
            setAbVariant(data);
            addToast("success", `User "${abUserId}" assigned to Variant ${data.variant}`);
        } catch (err) {
            setAbError(err.message);
            addToast("error", "Variant lookup failed: " + err.message);
        } finally {
            setAbLoading(false);
        }
    };

    // Full flow simulation
    const handleFullFlow = async () => {
        if (!flowUserId.trim()) {
            addToast("error", "User ID is required");
            return;
        }
        const ad_ids = flowAdIds.split(",").map(s => s.trim()).filter(Boolean);
        if (ad_ids.length === 0) {
            addToast("error", "Enter at least one Ad ID");
            return;
        }

        setFlowRunning(true);
        setFlowSteps([]);

        const pushStep = (step) => setFlowSteps(prev => [...prev, step]);

        // Step 1: Assign variant
        pushStep({ label: "1. GET /api/ab/variant", status: "running", detail: `user_id=${flowUserId}` });
        let variant = null;
        try {
            const vData = await getVariant(flowUserId.trim());
            variant = vData.variant;
            setFlowSteps(prev => prev.map((s, i) =>
                i === 0 ? { ...s, status: "done", detail: `Variant: ${variant}`, data: vData } : s
            ));
        } catch (err) {
            setFlowSteps(prev => prev.map((s, i) =>
                i === 0 ? { ...s, status: "error", detail: err.message } : s
            ));
            setFlowRunning(false);
            addToast("error", "Flow failed at variant assignment");
            return;
        }

        // Step 2: Choose model
        const model = variant === "A" ? "Model A (Logistic Regression)" : "Model B (XGBoost)";
        pushStep({ label: "2. Choose model", status: "done", detail: `Variant ${variant} → ${model}` });

        // Step 3: Batch predict
        pushStep({ label: "3. POST /api/ctr/batch_predict", status: "running", detail: `${ad_ids.length} ads` });
        let rankings = [];
        try {
            const results = await batchPredictCtr({
                user_id: flowUserId.trim(),
                ad_ids,
                device: "mobile",
                country: "US",
                hour: new Date().getHours(),
            });
            rankings = Array.isArray(results) ? results : [];
            setFlowSteps(prev => prev.map((s, i) =>
                i === 2 ? { ...s, status: "done", detail: `${rankings.length} predictions returned`, data: rankings } : s
            ));
        } catch (err) {
            setFlowSteps(prev => prev.map((s, i) =>
                i === 2 ? { ...s, status: "error", detail: err.message } : s
            ));
            setFlowRunning(false);
            addToast("error", "Flow failed at batch prediction");
            return;
        }

        // Step 4: Rank ads
        const ranked = [...rankings].sort((a, b) => (b.ctr_score ?? b.ctr ?? 0) - (a.ctr_score ?? a.ctr ?? 0));
        pushStep({
            label: "4. Rank ads by CTR", status: "done", detail: ranked.length > 0
                ? `Best: ${ranked[0].ad_id} (${formatCtr(ranked[0].ctr_score ?? ranked[0].ctr)})`
                : "No rankings available",
            data: ranked
        });

        // Step 5: Show ad
        const bestAd = ranked[0];
        pushStep({
            label: "5. Show ad to user",
            status: "done",
            detail: bestAd
                ? `Serving ${bestAd.ad_id} with CTR ${formatCtr(bestAd.ctr_score ?? bestAd.ctr)}`
                : "No ad to serve"
        });

        setFlowRunning(false);
        addToast("success", "Full flow completed!");
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
                <h1>CTR Prediction</h1>
                <p>Predict click-through rates, run batch predictions, and monitor A/B experiment assignments</p>
            </div>


            {/* Main Tabs */}
            <div className="tabs">
                <button className={`tab ${activeTab === "predict" ? "active" : ""}`} onClick={() => setActiveTab("predict")}>
                    🎯 CTR Predict
                </button>
                <button className={`tab ${activeTab === "ab" ? "active" : ""}`} onClick={() => setActiveTab("ab")}>
                    🧪 A/B Variant
                </button>
                <button className={`tab ${activeTab === "monitoring" ? "active" : ""}`} onClick={() => setActiveTab("monitoring")}>
                    📈 Model Monitoring
                </button>
                <button className={`tab ${activeTab === "pipeline" ? "active" : ""}`} onClick={() => setActiveTab("pipeline")}>
                    🔗 Event Pipeline
                </button>
                <button className={`tab ${activeTab === "logs" ? "active" : ""}`} onClick={() => setActiveTab("logs")}>
                    📝 Logs
                </button>
                <button className={`tab ${activeTab === "flow" ? "active" : ""}`} onClick={() => setActiveTab("flow")}>
                    ⚡ Full Flow
                </button>
            </div>

            {/* ═══ CTR PREDICT (with sub-tabs) ═══ */}
            {activeTab === "predict" && (
                <div className="animate-in">


                    {/* Single Predict */}
                    {predictSubTab === "single" && (
                        <div className="ctr-predict-layout animate-in">

                            <div className="ctr-form-panel">
                                <h3>🎯 User & Ad Input</h3>
                                {/* <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                    POST /api/ctr/predict — Single prediction request
                                </p> */}

                                <div className="form-group" ref={userDropdownRef} style={{ position: 'relative' }}>
                                    <label className="form-label">User ID</label>
                                    <input className="form-input mono" value={predictForm.user_id}
                                        onChange={e => {
                                            setPredictForm(p => ({ ...p, user_id: e.target.value }));
                                            setShowUserDropdown(true);
                                        }}
                                        onFocus={() => setShowUserDropdown(true)}
                                        placeholder="Search user ID..." />
                                    {showUserDropdown && (
                                        <div className="user-id-dropdown">
                                            {userIds
                                                .filter(id => id.toLowerCase().includes((predictForm.user_id || "").toLowerCase()))
                                                .map(id => (
                                                    <div
                                                        key={id}
                                                        className={`user-id-option ${predictForm.user_id === id ? "selected" : ""}`}
                                                        onClick={() => {
                                                            setPredictForm(p => ({ ...p, user_id: id }));
                                                            setShowUserDropdown(false);
                                                        }}
                                                    >
                                                        <span className="user-id-icon">👤</span>
                                                        <span className="user-id-text">{id}</span>
                                                    </div>
                                                ))}
                                            {userIds.filter(id => id.toLowerCase().includes((predictForm.user_id || "").toLowerCase())).length === 0 && (
                                                <div className="user-id-option no-match">
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No matching users — type a custom ID</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>



                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Device</label>
                                        <select className="form-select" value={predictForm.device}
                                            onChange={e => setPredictForm(p => ({ ...p, device: e.target.value }))}>
                                            {DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Country</label>
                                        <select className="form-select" value={predictForm.country}
                                            onChange={e => setPredictForm(p => ({ ...p, country: e.target.value }))}>
                                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Hour (0–23)</label>
                                    <input className="form-input mono" type="number" min="0" max="23"
                                        value={predictForm.hour}
                                        onChange={e => setPredictForm(p => ({ ...p, hour: e.target.value }))} />
                                </div>

                                <div className="form-actions">
                                    <button className="btn btn-primary" onClick={handlePredict} disabled={predicting} style={{ flex: 1 }}>
                                        {predicting ? "Predicting..." : "🚀 Get Predicted Ads"}
                                    </button>
                                </div>
                            </div>

                            <div className="ctr-result-panel">
                                <h3>📊 Prediction Result</h3>

                                {!predictionResult && !predictError && (
                                    <div className="ctr-empty-result">
                                        <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '0.75rem' }}>🎯</div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            Fill in the inputs and click "Predict CTR" to see results
                                        </p>
                                    </div>
                                )}

                                {predictError && (
                                    <div className="ctr-error-result">
                                        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                                        <div>
                                            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Prediction Failed</p>
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{predictError}</p>
                                        </div>
                                    </div>
                                )}

                                {predictionResult && (() => {
                                    // Extract predictions from either flat or nested structure
                                    const history = predictionResult.prediction_history;
                                    const entry = Array.isArray(history) && history.length > 0 ? history[0] : null;
                                    const predictions = predictionResult.predictions || (entry && entry.predictions) || [];
                                    const chosenAd = predictionResult.chosen_ad || (entry && entry.chosen_ad) || "—";
                                    const latency = predictionResult.total_latency_ms ?? (entry && entry.total_latency_ms) ?? null;
                                    const sorted = [...predictions].sort((a, b) => (b.ctr ?? 0) - (a.ctr ?? 0));

                                    return (
                                        <>
                                            {/* Predictions Table */}
                                            {sorted.length > 0 && (
                                                <div className="predict-table-wrap">
                                                    <table className="predict-table">
                                                        <thead>
                                                            <tr>
                                                                <th style={{ width: '36px' }}>#</th>
                                                                <th>Ad ID</th>
                                                                <th>Title</th>
                                                                <th>Category</th>
                                                                <th style={{ textAlign: 'right' }}>CTR</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {sorted.map((p, i) => {
                                                                const ctr = p.ctr ?? p.ctr_score ?? 0;
                                                                const isChosen = chosenAd === p.ad_id;
                                                                return (
                                                                    <tr key={p.ad_id || i} className={isChosen ? "chosen-row" : ""}>
                                                                        <td>
                                                                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                                                                        </td>
                                                                        <td><code>{p.ad_id || "—"}</code></td>
                                                                        <td>{p.title || "—"}</td>
                                                                        <td>
                                                                            <span className="predict-cat-tag">{p.category || "—"}</span>
                                                                        </td>
                                                                        <td style={{ textAlign: 'right' }}>
                                                                            <span className={`predict-ctr ${ctr >= 0.7 ? 'high' : ctr >= 0.4 ? 'mid' : 'low'}`}>
                                                                                {(ctr * 100).toFixed(1)}%
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {/* Summary */}
                                            <div className="ctr-meta-grid" style={{ marginTop: '1rem' }}>
                                                <div className="ctr-meta-item">
                                                    <span className="ctr-meta-label">User</span>
                                                    <span className="ctr-meta-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                                        {predictionResult.user_id || predictForm.user_id}
                                                    </span>
                                                </div>
                                                <div className="ctr-meta-item">
                                                    <span className="ctr-meta-label">Chosen Ad</span>
                                                    <span className="ctr-meta-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-green)' }}>
                                                        {chosenAd}
                                                    </span>
                                                </div>
                                                <div className="ctr-meta-item">
                                                    <span className="ctr-meta-label">Total Ads</span>
                                                    <span className="ctr-meta-value">
                                                        {sorted.length || "—"}
                                                    </span>
                                                </div>
                                                <div className="ctr-meta-item">
                                                    <span className="ctr-meta-label">Latency</span>
                                                    <span className="ctr-meta-value">
                                                        {latency != null ? `${latency}ms` : "—"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* <div style={{ marginTop: '1.25rem' }}>
                                                <span className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Raw Response</span>
                                                <div className="json-block">{JSON.stringify(predictionResult, null, 2)}</div>
                                            </div> */}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Batch Predict */}
                    {predictSubTab === "batch" && (
                        <div className="ctr-predict-layout animate-in">

                            <div className="ctr-form-panel">
                                <h3>📋 Batch Prediction</h3>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                    POST /api/ctr/batch_predict — Predict CTR for multiple ads in a single request
                                </p>

                                <div className="form-group">
                                    <label className="form-label">User ID</label>
                                    <input className="form-input mono" value={batchForm.user_id}
                                        onChange={e => setBatchForm(p => ({ ...p, user_id: e.target.value }))}
                                        placeholder="user-123" />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Ad IDs (comma-separated)</label>
                                    <input className="form-input mono" value={batchForm.ad_ids_str}
                                        onChange={e => setBatchForm(p => ({ ...p, ad_ids_str: e.target.value }))}
                                        placeholder="ad-001, ad-002, ad-003" />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Device</label>
                                        <select className="form-select" value={batchForm.device}
                                            onChange={e => setBatchForm(p => ({ ...p, device: e.target.value }))}>
                                            {DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Country</label>
                                        <select className="form-select" value={batchForm.country}
                                            onChange={e => setBatchForm(p => ({ ...p, country: e.target.value }))}>
                                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Hour (0–23)</label>
                                    <input className="form-input mono" type="number" min="0" max="23"
                                        value={batchForm.hour}
                                        onChange={e => setBatchForm(p => ({ ...p, hour: e.target.value }))} />
                                </div>

                                <div className="form-actions">
                                    <button className="btn btn-primary" onClick={handleBatchPredict} disabled={batchRunning} style={{ flex: 1 }}>
                                        {batchRunning ? "Running..." : "🚀 Run Batch Prediction"}
                                    </button>
                                </div>

                                <div className="json-block" style={{ marginTop: '1rem', fontSize: '0.72rem' }}>
                                    {`POST /api/ctr/batch_predict
{
  "user_id": "${batchForm.user_id || "user-123"}",
  "ad_ids": [${batchForm.ad_ids_str.split(",").map(s => `"${s.trim()}"`).join(", ")}],
  "device": "${batchForm.device}",
  "country": "${batchForm.country}",
  "hour": ${batchForm.hour}
}`}
                                </div>
                            </div>

                            <div className="ctr-result-panel">
                                <h3>📊 Batch Results</h3>

                                {batchResults.length === 0 && !batchError && (
                                    <div className="ctr-empty-result">
                                        <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '0.75rem' }}>📋</div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            Enter a user ID and ad IDs, then click "Run Batch Prediction"
                                        </p>
                                    </div>
                                )}

                                {batchError && (
                                    <div className="ctr-error-result">
                                        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                                        <div>
                                            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Batch Prediction Failed</p>
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{batchError}</p>
                                        </div>
                                    </div>
                                )}

                                {batchResults.length > 0 && (
                                    <>
                                        <div className="event-table-wrapper" style={{ border: 'none', background: 'transparent' }}>
                                            <table className="event-table">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Ad ID</th>
                                                        <th>CTR Score</th>
                                                        <th>Model</th>
                                                        <th>Variant</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[...batchResults]
                                                        .sort((a, b) => (b.ctr_score ?? b.ctr ?? 0) - (a.ctr_score ?? a.ctr ?? 0))
                                                        .map((row, idx) => (
                                                            <tr key={idx}>
                                                                <td style={{ color: idx === 0 ? 'var(--accent-amber)' : 'var(--text-muted)', fontWeight: idx === 0 ? 700 : 400 }}>
                                                                    {idx === 0 ? "🏆" : idx + 1}
                                                                </td>
                                                                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                                    {row.ad_id}
                                                                </td>
                                                                <td>
                                                                    <span style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '1rem' }}>
                                                                        {formatCtr(row.ctr_score ?? row.ctr)}
                                                                    </span>
                                                                </td>
                                                                <td>{row.model_version || row.version || "—"}</td>
                                                                <td style={{ color: 'var(--accent-purple)' }}>{row.variant || "—"}</td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {(() => {
                                            const best = [...batchResults].sort((a, b) => (b.ctr_score ?? b.ctr ?? 0) - (a.ctr_score ?? a.ctr ?? 0))[0];
                                            if (!best) return null;
                                            return (
                                                <div className="ctr-best-card">
                                                    <span style={{ fontSize: '1.5rem' }}>🏆</span>
                                                    <div>
                                                        <p style={{ fontWeight: 600, marginBottom: '2px' }}>
                                                            Winner: <span style={{ color: 'var(--accent-blue)' }}>{best.ad_id}</span>
                                                        </p>
                                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                            CTR: {formatCtr(best.ctr_score ?? best.ctr)}
                                                            {best.variant ? ` • Variant ${best.variant}` : ""}
                                                            {best.model_version ? ` • ${best.model_version}` : ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ A/B VARIANT TAB ═══ */}
            {activeTab === "ab" && (
                <div className="ctr-predict-layout animate-in">

                    <div className="ctr-form-panel">
                        <h3>🧪 Assign Variant</h3>
                        {/* <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                            GET /api/ab/variant?user_id=&#123;userId&#125; — Get the A/B variant assignment
                        </p> */}

                        <div className="form-group">
                            <label className="form-label">User ID</label>
                            <input className="form-input mono" value={abUserId}
                                onChange={e => setAbUserId(e.target.value)}
                                placeholder="user-123"
                                onKeyDown={e => e.key === "Enter" && handleVariantLookup()} />
                        </div>

                        <div className="form-actions">
                            <button className="btn btn-primary" onClick={handleVariantLookup} disabled={abLoading} style={{ flex: 1 }}>
                                {abLoading ? "Looking up..." : "🔍 Get Variant"}
                            </button>
                        </div>

                        {/* <div className="json-block" style={{ marginTop: '1rem', fontSize: '0.72rem' }}>
                            {`GET /api/ab/variant?user_id=${abUserId || "123"}

Expected Response:
{
  "variant": "A" or "B"
}`}
                        </div> */}
                    </div>

                    <div className="ctr-result-panel">
                        <h3>📊 Variant Assignment</h3>

                        {!abVariant && !abError && (
                            <div className="ctr-empty-result">
                                <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '0.75rem' }}>🧪</div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    Enter a User ID and click "Get Variant" to see their assignment
                                </p>
                            </div>
                        )}

                        {abError && (
                            <div className="ctr-error-result">
                                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                                <div>
                                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Variant Lookup Failed</p>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{abError}</p>
                                </div>
                            </div>
                        )}

                        {abVariant && (
                            <>
                                {/* Big variant display */}
                                <div className="ctr-score-display">
                                    <div className="ctr-score-ring" style={{
                                        borderColor: abVariant.variant === "A" ? 'rgba(59,130,246,0.4)' : 'rgba(139,92,246,0.4)'
                                    }}>
                                        <span className="ctr-score-value">{abVariant.variant || "—"}</span>
                                    </div>
                                    <span className="ctr-score-label">Assigned Variant</span>
                                </div>

                                <div className="ctr-meta-grid">
                                    <div className="ctr-meta-item">
                                        <span className="ctr-meta-label">User ID</span>
                                        <span className="ctr-meta-value" style={{ fontFamily: 'monospace' }}>{abUserId}</span>
                                    </div>
                                    <div className="ctr-meta-item">
                                        <span className="ctr-meta-label">Variant</span>
                                        <span className="ctr-meta-value" style={{
                                            color: abVariant.variant === "A" ? 'var(--accent-blue)' : 'var(--accent-purple)',
                                            fontSize: '1.25rem',
                                            fontWeight: 800
                                        }}>
                                            {abVariant.variant || "—"}
                                        </span>
                                    </div>
                                    <div className="ctr-meta-item">
                                        <span className="ctr-meta-label">Model Used</span>
                                        <span className="ctr-meta-value">
                                            {abVariant.variant === "A" ? "Logistic Regression" : abVariant.variant === "B" ? "XGBoost" : "—"}
                                        </span>
                                    </div>
                                    <div className="ctr-meta-item">
                                        <span className="ctr-meta-label">Experiment</span>
                                        <span className="ctr-meta-value">CTR_Model_Test</span>
                                    </div>
                                </div>

                                {/* Traffic split bar */}
                                <div className="ab-experiment-card" style={{ marginTop: '1.25rem' }}>
                                    <div className="ab-experiment-header">
                                        <span style={{ fontSize: '1rem' }}>🧪</span>
                                        <span style={{ fontWeight: 600 }}>Experiment: CTR_Model_Test</span>
                                        <span className="experiment-status running">
                                            <span className="status-indicator"></span>
                                            Running
                                        </span>
                                    </div>
                                    <div className="ab-split-bar">
                                        <div className="ab-split-a" style={{
                                            width: '50%',
                                            opacity: abVariant.variant === "A" ? 1 : 0.4,
                                            outline: abVariant.variant === "A" ? '2px solid var(--accent-blue)' : 'none',
                                        }}>
                                            <span>{abVariant.variant === "A" ? "⬤ " : ""}Variant A — 50%</span>
                                        </div>
                                        <div className="ab-split-b" style={{
                                            width: '50%',
                                            opacity: abVariant.variant === "B" ? 1 : 0.4,
                                            outline: abVariant.variant === "B" ? '2px solid var(--accent-purple)' : 'none',
                                        }}>
                                            <span>{abVariant.variant === "B" ? "⬤ " : ""}Variant B — 50%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* <div style={{ marginTop: '1rem' }}>
                                    <span className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Raw Response</span>
                                    <div className="json-block">{JSON.stringify(abVariant, null, 2)}</div>
                                </div> */}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ FULL FLOW TAB ═══ */}
            {activeTab === "flow" && (
                <div className="animate-in">

                    <div className="ctr-predict-layout">
                        <div className="ctr-form-panel">
                            <h3>⚡ Simulate Full Flow</h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                Runs the complete pipeline: Assign variant → choose model → batch predict → rank → serve
                            </p>

                            <div className="form-group">
                                <label className="form-label">User ID</label>
                                <input className="form-input mono" value={flowUserId}
                                    onChange={e => setFlowUserId(e.target.value)}
                                    placeholder="user-123" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Ad IDs (comma-separated)</label>
                                <input className="form-input mono" value={flowAdIds}
                                    onChange={e => setFlowAdIds(e.target.value)}
                                    placeholder="ad-101, ad-102, ad-103" />
                            </div>

                            <div className="form-actions">
                                <button className="btn btn-primary" onClick={handleFullFlow} disabled={flowRunning} style={{ flex: 1 }}>
                                    {flowRunning ? "Running pipeline..." : "⚡ Run Full Flow"}
                                </button>
                            </div>
                        </div>

                        <div className="ctr-result-panel">
                            <h3>📊 Pipeline Steps</h3>

                            {flowSteps.length === 0 && (
                                <div className="ctr-empty-result">
                                    <div style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '0.75rem' }}>⚡</div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        Click "Run Full Flow" to simulate the entire ad serving pipeline
                                    </p>
                                </div>
                            )}

                            {flowSteps.length > 0 && (
                                <div className="flow-steps-list">
                                    {flowSteps.map((step, idx) => (
                                        <div key={idx} className={`flow-step-item ${step.status}`}>
                                            <div className="flow-step-indicator">
                                                {step.status === "done" && "✅"}
                                                {step.status === "running" && (
                                                    <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                                                )}
                                                {step.status === "error" && "❌"}
                                            </div>
                                            <div className="flow-step-content">
                                                <div className="flow-step-label">{step.label}</div>
                                                <div className="flow-step-detail">{step.detail}</div>
                                                {step.data && (
                                                    <details style={{ marginTop: '0.5rem' }}>
                                                        <summary style={{ fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                            View response data
                                                        </summary>
                                                        {/* <div className="json-block" style={{ marginTop: '0.5rem', fontSize: '0.7rem' }}>
                                                            {JSON.stringify(step.data, null, 2)}
                                                        </div> */}
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ MODEL MONITORING ═══ */}
            {activeTab === "monitoring" && (
                <div className="animate-in">
                    <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>📈 Model Monitoring</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Live performance metrics for deployed CTR prediction models
                    </p>

                    <div className="ctr-meta-grid" style={{ marginBottom: '1.5rem' }}>
                        <div className="ctr-meta-item">
                            <span className="ctr-meta-label">Active Model</span>
                            <span className="ctr-meta-value" style={{ color: 'var(--accent-green)' }}>XGBoost v3</span>
                        </div>
                        <div className="ctr-meta-item">
                            <span className="ctr-meta-label">Accuracy (AUC)</span>
                            <span className="ctr-meta-value">0.847</span>
                        </div>
                        <div className="ctr-meta-item">
                            <span className="ctr-meta-label">Avg Latency</span>
                            <span className="ctr-meta-value">12ms</span>
                        </div>
                        <div className="ctr-meta-item">
                            <span className="ctr-meta-label">Predictions (24h)</span>
                            <span className="ctr-meta-value">1.2M</span>
                        </div>
                    </div>

                    <div className="event-table-wrapper">
                        <div className="event-table-header">
                            <span className="event-table-title">Model Version History</span>
                        </div>
                        <table className="event-table">
                            <thead>
                                <tr><th>Version</th><th>Model</th><th>AUC</th><th>Latency</th><th>Traffic</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontFamily: 'monospace', color: 'var(--accent-blue)' }}>v3</td>
                                    <td>XGBoost</td>
                                    <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>0.847</td>
                                    <td>12ms</td>
                                    <td>50% (Variant B)</td>
                                    <td><span className="event-type-badge impression">● Active</span></td>
                                </tr>
                                <tr>
                                    <td style={{ fontFamily: 'monospace', color: 'var(--accent-blue)' }}>v2</td>
                                    <td>Logistic Regression</td>
                                    <td style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>0.791</td>
                                    <td>5ms</td>
                                    <td>50% (Variant A)</td>
                                    <td><span className="event-type-badge impression">● Active</span></td>
                                </tr>
                                <tr style={{ opacity: 0.5 }}>
                                    <td style={{ fontFamily: 'monospace' }}>v1</td>
                                    <td>Random Forest</td>
                                    <td>0.723</td>
                                    <td>28ms</td>
                                    <td>0%</td>
                                    <td><span className="event-type-badge conversion" style={{ background: 'rgba(244,63,94,0.08)', color: 'var(--accent-rose)' }}>Retired</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══ EVENT PIPELINE ═══ */}
            {activeTab === "pipeline" && (
                <div className="animate-in">
                    <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>🔗 Event Pipeline</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Architecture of the ad serving and prediction pipeline
                    </p>

                    <div className="json-block" style={{ fontSize: '0.78rem', lineHeight: 1.8 }}>
                        {`┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   React UI   │────▶│  Ad Service  │────▶│  CTR Service │
│   :5173      │     │  :8085       │     │  :8000       │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                           │                     │
                     ┌─────▼─────┐         ┌─────▼─────┐
                     │   Redis   │         │  A/B Test  │
                     │  (dedup)  │         │ (variant)  │
                     └─────┬─────┘         └───────────┘
                           │
                     ┌─────▼─────┐     ┌──────────────┐
                     │   Kafka   │────▶│    Flink     │
                     │  (events) │     │ (aggregate)  │
                     └───────────┘     └──────┬───────┘
                                              │
                                        ┌─────▼─────┐
                                        │ ClickHouse│
                                        │ (analytics)│
                                        └───────────┘`}
                    </div>

                    <div className="ctr-meta-grid" style={{ marginTop: '1.5rem' }}>
                        <div className="ctr-meta-item">
                            <span className="ctr-meta-label">Ad Service</span>
                            <span className="ctr-meta-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>:8085</span>
                        </div>
                        <div className="ctr-meta-item">
                            <span className="ctr-meta-label">Analytics</span>
                            <span className="ctr-meta-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>:8086</span>
                        </div>
                        <div className="ctr-meta-item">
                            <span className="ctr-meta-label">CTR Predict</span>
                            <span className="ctr-meta-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>:8000</span>
                        </div>
                        <div className="ctr-meta-item">
                            <span className="ctr-meta-label">Frontend</span>
                            <span className="ctr-meta-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>:5173</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ LOGS ═══ */}
            {activeTab === "logs" && (
                <div className="animate-in">
                    <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>📝 Prediction Logs</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Recent prediction requests and responses
                    </p>

                    {predictionResult || batchResults.length > 0 || abVariant ? (
                        <div className="event-table-wrapper">
                            <div className="event-table-header">
                                <span className="event-table-title">Session Log</span>
                            </div>
                            <table className="event-table">
                                <thead>
                                    <tr><th>Time</th><th>Type</th><th>Endpoint</th><th>Status</th><th>Detail</th></tr>
                                </thead>
                                <tbody>
                                    {predictionResult && (
                                        <tr>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {new Date().toLocaleTimeString()}
                                            </td>
                                            <td><span className="event-type-badge impression">Single</span></td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>POST /api/ctr/predict</td>
                                            <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>200 OK</td>
                                            <td>CTR: {formatCtr(predictionResult.ctr_score ?? predictionResult.ctr)}</td>
                                        </tr>
                                    )}
                                    {batchResults.length > 0 && (
                                        <tr>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {new Date().toLocaleTimeString()}
                                            </td>
                                            <td><span className="event-type-badge click">Batch</span></td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>POST /api/ctr/batch_predict</td>
                                            <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>200 OK</td>
                                            <td>{batchResults.length} predictions</td>
                                        </tr>
                                    )}
                                    {abVariant && (
                                        <tr>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {new Date().toLocaleTimeString()}
                                            </td>
                                            <td><span className="event-type-badge conversion" style={{ background: 'rgba(139,92,246,0.08)', color: 'var(--accent-purple)' }}>A/B</span></td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>GET /api/ab/variant</td>
                                            <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>200 OK</td>
                                            <td>Variant {abVariant.variant}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📝</div>
                            <div className="empty-state-title">No Logs Yet</div>
                            <div className="empty-state-desc">
                                Make predictions using "Predict CTR", "Batch Predict", or "A/B Variant" to see request logs here.
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab("predict")}>🎯 Start Predicting</button>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

// Helper
function formatCtr(value) {
    if (value == null) return "—";
    if (typeof value === "number" && value <= 1) return (value * 100).toFixed(1) + "%";
    return String(value);
}
