import React, { useEffect } from "react";
import { logImpression, logClick } from "../services/eventService";
import { recordAdClick } from "../services/adService";

export default function AdCard({ ad }) {

  useEffect(() => {
    logImpression(ad);
  }, [ad]);

  const handleClick = async () => {
    // Use the real click pipeline: POST /click/adclick → Redis dedup → Kafka → 302
    try {
      await recordAdClick(ad.adId || ad.id, `user-${Date.now()}`);
    } catch {
      // fallback
      logClick(ad);
    }

    if (ad.clickUrl || ad.click_url || ad.targetUrl) {
      window.open(ad.clickUrl || ad.click_url || ad.targetUrl);
    }
  };

  const title = ad.title || ad.name || ad.adTitle || ad.companyName || ad.company_name || ad.company || "Untitled Ad";
  const imageUrl = ad.imageUrl || ad.image_url || ad.s3ImageUrl;
  const ctr = ad.ctr != null ? ad.ctr : null;
  const variant = ad.variant || ad.campaignId || null;
  const adId = ad.adId || ad.id || "—";
  const campaignId = ad.campaignId || ad.campaign_id || "—";

  return (
    <div className="ad-card">

      <div className="ad-card-image-wrapper">
        {imageUrl ? (
          <img src={imageUrl} alt={title} />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))'
          }}>
            📢
          </div>
        )}
        <span className="ad-card-badge">Sponsored</span>
      </div>

      <div className="ad-card-body">
        <h3 className="ad-card-title">{title}</h3>

        <div className="ad-card-metrics">
          <div className="ad-metric">
            <span className="ad-metric-label">Ad ID</span>
            <span className="ad-metric-value" style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>
              {adId}
            </span>
          </div>
          <div className="ad-metric">
            <span className="ad-metric-label">Campaign</span>
            <span className="ad-metric-value variant" style={{ fontSize: '0.78rem' }}>
              {campaignId}
            </span>
          </div>
          {ctr != null && (
            <div className="ad-metric">
              <span className="ad-metric-label">CTR</span>
              <span className="ad-metric-value ctr">
                {typeof ctr === 'number' && ctr < 1 ? `${(ctr * 100).toFixed(1)}%` : ctr}
              </span>
            </div>
          )}
        </div>

        <div className="ad-card-actions">
          <button className="btn btn-primary btn-sm" onClick={handleClick}>
            �️ Click Ad
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => logClick(ad)}>
            📊 Track
          </button>
        </div>
      </div>

    </div>
  );
}