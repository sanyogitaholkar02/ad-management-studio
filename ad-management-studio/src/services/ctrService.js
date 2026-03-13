// ============================================
//  CTR Prediction + A/B Service — Django (port 8000)
// ============================================

const BASE = "";  // proxied via Vite

// ── A/B Variant Assignment ──

/**
 * Get the assigned variant for a user
 * GET /api/ab/variant?user_id=123
 *
 * Response: { "variant": "B" }
 */
export async function getVariant(userId) {
    const res = await fetch(`${BASE}/api/ab/variant?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`Variant lookup failed: ${res.status}`);
    return res.json();
}

// ── Single CTR Prediction ──

/**
 * POST /api/ctr/predict
 *
 * Payload: { user_id, ad_id, device, country, hour }
 * Response: { ctr_score, model_version, variant, ... }
 */
export async function predictCtr({ user_id, ad_id, device, country, hour }) {
    const res = await fetch(`${BASE}/api/ctr/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, ad_id, device, country, hour }),
    });
    if (!res.ok) throw new Error(`CTR prediction failed: ${res.status}`);
    return res.json();
}

/**
 * GET /api/ctr/predict/{userId}
 *
 * Response: { user_id, chosen_ad, predictions: [...], total_latency_ms }
 */
export async function predictCtrByUser(userId) {
    const res = await fetch(`${BASE}/api/ctr/predict/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`CTR prediction failed: ${res.status}`);
    return res.json();
}

// ── Batch CTR Prediction ──

/**
 * POST /api/ctr/batch_predict
 *
 * Payload: { user_id, ad_ids: [...], device, country, hour }
 * Response: [ { ad_id, ctr_score, model_version, variant }, ... ]
 */
export async function batchPredictCtr({ user_id, ad_ids, device, country, hour }) {
    const res = await fetch(`${BASE}/api/ctr/batch_predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, ad_ids, device, country, hour }),
    });
    if (!res.ok) throw new Error(`Batch prediction failed: ${res.status}`);
    return res.json();
}
