// Ad Processor Service — Advertisements CRUD (port 8085)

const BASE = "";  // proxied via Vite

/** Health check */
export async function healthCheck() {
  const res = await fetch(`${BASE}/ads/start`);
  return res.text();
}

/** Get all ads */
export async function fetchAllAds() {
  const res = await fetch(`${BASE}/ads/all`);
  if (!res.ok) throw new Error(`Failed to fetch ads: ${res.status}`);
  return res.json();
}

/** Add a single ad */
export async function createAd(ad) {
  const res = await fetch(`${BASE}/ads/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ad),
  });
  if (!res.ok) throw new Error(`Failed to create ad: ${res.status}`);
  return res.json();
}

/** Bulk add ads */
export async function createAds(adList) {
  const res = await fetch(`${BASE}/ads/add-list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adList),
  });
  if (!res.ok) throw new Error(`Failed to create ads: ${res.status}`);
  return res.json();
}

/** Upload ad image to S3 */
export async function uploadAdImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/ads/upload-image`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Failed to upload image: ${res.status}`);
  return res.json();
}

/** Record a click (Redis dedup → Kafka → 302 redirect) */
export async function recordAdClick(clickEvent) {
  const res = await fetch(`${BASE}/events/adclick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clickEvent),
    redirect: "manual",  // handle 302 ourselves
  });
  if (res.status === 302) {
    return { status: 302, message: "Click processed — redirect issued", redirectUrl: res.headers.get("Location") };
  }
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(errorBody || `Ad click failed: ${res.status}`);
  }
  return { status: res.status, message: "Click processed successfully" };
}

/** Get users who clicked on a specific ad */
export async function fetchAdSubscribers(adId, campaignId) {
  const res = await fetch(`${BASE}/ads/adsSubscribers?adId=${encodeURIComponent(adId)}&campaignId=${encodeURIComponent(campaignId)}`);
  if (!res.ok) throw new Error(`Failed to fetch subscribers: ${res.status}`);
  return res.json();
}