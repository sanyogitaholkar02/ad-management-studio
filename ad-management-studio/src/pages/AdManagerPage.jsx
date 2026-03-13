import React, { useState, useEffect } from "react";
import { fetchAllAds, createAd, uploadAdImage } from "../services/adService";

export default function AdManagerPage() {
    const [activeSection, setActiveSection] = useState("all-ads");
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Post Ad form
    const [form, setForm] = useState({
        adId: "",
        title: "",
        description: "",
        targetUrl: "",
        campaignId: "",
        imageUrl: "",
    });

    // Image upload
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    // Toast
    const [toasts, setToasts] = useState([]);
    const addToast = (type, message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

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
            setError("Unable to connect to the ad service on port 8085.");
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title) {
            addToast("error", "Title is required");
            return;
        }
        try {
            const payload = { ...form };
            Object.keys(payload).forEach(k => { if (!payload[k]) delete payload[k]; });
            await createAd(payload);
            addToast("success", `Ad "${form.title}" created successfully!`);
            setForm({ adId: "", title: "", description: "", targetUrl: "", campaignId: "", imageUrl: "" });
            loadAds();
            setActiveSection("all-ads");
        } catch (err) {
            addToast("error", "Failed to create ad: " + err.message);
        }
    };

    const handleImageUpload = async () => {
        if (!uploadFile) {
            addToast("error", "Select an image file first");
            return;
        }
        setUploading(true);
        setUploadResult(null);
        try {
            const result = await uploadAdImage(uploadFile);
            setUploadResult(result);
            const url = result?.url || result?.imageUrl || result?.s3Url || "";
            if (url) {
                setForm(prev => ({ ...prev, imageUrl: url }));
            }
            addToast("success", "Image uploaded to S3!");
            setUploadFile(null);
        } catch (err) {
            addToast("error", "Failed to upload image: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const sidebarItems = [
        { key: "all-ads", icon: "📋", label: "Get All Ads", desc: "GET /ads/all" },
        { key: "post-ad", icon: "➕", label: "Post Ad", desc: "POST /ads/add" },
        { key: "post-image", icon: "🖼️", label: "Post Image", desc: "POST /ads/upload-image" },
    ];

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
                <h1>Ad Manager</h1>
                <p>Create, upload, and manage advertisements — persisted to MySQL with images on S3</p>
            </div>

            <div className="ad-manager-layout">

                {/* ── Sidebar ── */}
                <div className="ad-manager-sidebar">
                    {sidebarItems.map(item => (
                        <div
                            key={item.key}
                            className={`ad-sidebar-item ${activeSection === item.key ? "active" : ""}`}
                            onClick={() => setActiveSection(item.key)}
                        >
                            <span className="ad-sidebar-icon">{item.icon}</span>
                            <div className="ad-sidebar-text">
                                <span className="ad-sidebar-label">{item.label}</span>
                                <span className="ad-sidebar-desc">{item.desc}</span>
                            </div>
                            {item.key === "all-ads" && ads.length > 0 && (
                                <span className="ad-sidebar-badge">{ads.length}</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Content Area ── */}
                <div className="ad-manager-content">

                    {/* ═══ GET ALL ADS ═══ */}
                    {activeSection === "all-ads" && (
                        <div className="animate-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <h3 className="section-title" style={{ margin: 0 }}>📋 All Advertisements</h3>
                                <button className="btn btn-secondary btn-sm" onClick={loadAds}>🔄 Refresh</button>
                            </div>

                            {loading && (
                                <div className="loading-container">
                                    <div className="loading-spinner"></div>
                                    <span className="loading-text">Fetching ads from MySQL...</span>
                                </div>
                            )}

                            {error && (
                                <div className="empty-state">
                                    <div className="empty-state-icon">⚠️</div>
                                    <div className="empty-state-title">Connection Error</div>
                                    <div className="empty-state-desc">{error}</div>
                                    <button className="btn btn-primary btn-sm" onClick={loadAds}>Retry</button>
                                </div>
                            )}

                            {!loading && !error && ads.length === 0 && (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📦</div>
                                    <div className="empty-state-title">No Ads Yet</div>
                                    <div className="empty-state-desc">
                                        Create your first advertisement using the "Post Ad" section.
                                    </div>
                                    <button className="btn btn-primary btn-sm" onClick={() => setActiveSection("post-ad")}>
                                        ➕ Post Ad
                                    </button>
                                </div>
                            )}

                            {!loading && !error && ads.length > 0 && (
                                <div className="event-table-wrapper">
                                    <div className="event-table-header">
                                        <span className="event-table-title">GET /ads/all — {ads.length} results</span>
                                    </div>
                                    <table className="event-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Company / Title</th>
                                                <th>Ad ID</th>
                                                <th>Campaign ID</th>
                                                <th>Image</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ads.map((ad, idx) => {
                                                const name = ad.title || ad.name || ad.adTitle || ad.companyName || ad.company_name || ad.company || "—";
                                                const adId = ad.adId || ad.id || "—";
                                                const campaign = ad.campaignId || ad.campaign_id || "—";
                                                const imageUrl = ad.imageUrl || ad.image_url || ad.s3ImageUrl;

                                                return (
                                                    <tr key={ad.id || idx}>
                                                        <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{idx + 1}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <div className="ad-table-thumb">
                                                                    {imageUrl ? (
                                                                        <img src={imageUrl} alt={name} />
                                                                    ) : (
                                                                        <span style={{ fontSize: '1.2rem' }}>📢</span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{name}</div>
                                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                                        {ad.description ? ad.description.substring(0, 50) + (ad.description.length > 50 ? '...' : '') : "No description"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent-blue)' }}>
                                                                {adId}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent-purple)' }}>
                                                                {campaign}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {imageUrl ? (
                                                                <span className="event-type-badge impression">✓ S3</span>
                                                            ) : (
                                                                <span className="event-type-badge conversion" style={{ background: 'rgba(244,63,94,0.08)', color: 'var(--accent-rose)' }}>
                                                                    None
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(JSON.stringify(ad, null, 2));
                                                                    addToast("info", "Ad JSON copied to clipboard");
                                                                }}
                                                            >
                                                                📋 Copy
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ POST AD ═══ */}
                    {activeSection === "post-ad" && (
                        <div className="animate-in">
                            <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>➕ Create Advertisement</h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                POST /ads/add — Create a single advertisement
                            </p>

                            <div className="ad-post-form-wrapper">
                                <form onSubmit={handleSubmit}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Ad ID</label>
                                            <input className="form-input mono" name="adId" value={form.adId} onChange={handleFormChange} placeholder="ad-001" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Campaign ID</label>
                                            <input className="form-input mono" name="campaignId" value={form.campaignId} onChange={handleFormChange} placeholder="camp-100" />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Title *</label>
                                        <input className="form-input" name="title" value={form.title} onChange={handleFormChange} placeholder="My Awesome Ad" required />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea className="form-textarea" name="description" value={form.description} onChange={handleFormChange} placeholder="Brief description of the ad..." />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Target URL</label>
                                        <input className="form-input" name="targetUrl" value={form.targetUrl} onChange={handleFormChange} placeholder="https://example.com" />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Image URL</label>
                                        <input className="form-input" name="imageUrl" value={form.imageUrl} onChange={handleFormChange} placeholder="Auto-filled after S3 upload, or enter manually" />
                                    </div>

                                    {/* Request preview */}
                                    <div className="json-block" style={{ marginBottom: '1rem', fontSize: '0.72rem' }}>
                                        {`POST /ads/add
Content-Type: application/json

${JSON.stringify(
                                            Object.fromEntries(Object.entries(form).filter(([, v]) => v)),
                                            null, 2
                                        )}`}
                                    </div>

                                    <div className="form-actions">
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                            🚀 Create Ad
                                        </button>
                                        <button type="button" className="btn btn-secondary" onClick={() => setActiveSection("post-image")}>
                                            🖼️ Upload Image First
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* ═══ POST IMAGE ═══ */}
                    {activeSection === "post-image" && (
                        <div className="animate-in">
                            <h3 className="section-title" style={{ marginBottom: '0.25rem' }}>🖼️ Upload Ad Image</h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                POST /ads/upload-image — Upload an image to S3 and get the URL
                            </p>

                            <div className="ad-post-form-wrapper">
                                <div className="file-upload-zone" style={{ marginBottom: '1.5rem' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => { setUploadFile(e.target.files[0]); setUploadResult(null); }}
                                    />
                                    <div className="file-upload-icon">📤</div>
                                    <div className="file-upload-text">
                                        {uploadFile ? uploadFile.name : "Drop image or click to browse"}
                                    </div>
                                    <div className="file-upload-hint">
                                        Supported: JPG, PNG, GIF, WebP
                                    </div>
                                </div>

                                {uploadFile && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div className="ctr-meta-grid">
                                            <div className="ctr-meta-item">
                                                <span className="ctr-meta-label">File Name</span>
                                                <span className="ctr-meta-value" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                                    {uploadFile.name}
                                                </span>
                                            </div>
                                            <div className="ctr-meta-item">
                                                <span className="ctr-meta-label">Size</span>
                                                <span className="ctr-meta-value">
                                                    {(uploadFile.size / 1024).toFixed(1)} KB
                                                </span>
                                            </div>
                                            <div className="ctr-meta-item">
                                                <span className="ctr-meta-label">Type</span>
                                                <span className="ctr-meta-value">{uploadFile.type || "—"}</span>
                                            </div>
                                            <div className="ctr-meta-item">
                                                <span className="ctr-meta-label">Endpoint</span>
                                                <span className="ctr-meta-value" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                                    POST /ads/upload-image
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="form-actions" style={{ marginBottom: '1.5rem' }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleImageUpload}
                                        disabled={!uploadFile || uploading}
                                        style={{ flex: 1 }}
                                    >
                                        {uploading ? "Uploading..." : "☁️ Upload to S3"}
                                    </button>
                                </div>

                                {uploadResult && (
                                    <div>
                                        <div className="form-label" style={{ marginBottom: '0.5rem' }}>Upload Response</div>
                                        <div className="json-block" style={{ marginBottom: '1rem' }}>
                                            {JSON.stringify(uploadResult, null, 2)}
                                        </div>

                                        {(uploadResult.url || uploadResult.imageUrl || uploadResult.s3Url) && (
                                            <div className="ctr-best-card">
                                                <span style={{ fontSize: '1.5rem' }}>✅</span>
                                                <div>
                                                    <p style={{ fontWeight: 600, marginBottom: '4px' }}>Image Uploaded Successfully</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                                                        {uploadResult.url || uploadResult.imageUrl || uploadResult.s3Url}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="form-actions" style={{ marginTop: '1rem' }}>
                                            <button className="btn btn-primary btn-sm" onClick={() => {
                                                setActiveSection("post-ad");
                                            }}>
                                                ➕ Go Create Ad with this Image
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => {
                                                const url = uploadResult.url || uploadResult.imageUrl || uploadResult.s3Url || JSON.stringify(uploadResult);
                                                navigator.clipboard.writeText(url);
                                                addToast("info", "S3 URL copied to clipboard");
                                            }}>
                                                📋 Copy URL
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!uploadFile && !uploadResult && (
                                    <div className="json-block" style={{ fontSize: '0.72rem' }}>
                                        {`POST /ads/upload-image
Content-Type: multipart/form-data

Form field: "file" → <image binary>

Response:
{
  "url": "https://s3.amazonaws.com/bucket/image-xxx.jpg"
}

The returned URL can be used in the "Post Ad" form's Image URL field.`}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
