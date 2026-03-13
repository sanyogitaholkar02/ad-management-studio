// ============================================
//  Event Service — Click tracking (port 8080)
// ============================================

/** Record an ad impression (client-side tracking) */
export async function logImpression(ad) {
  try {
    console.log("[Event] Impression logged:", ad?.adId || ad?.id);
  } catch (err) {
    console.error("Failed to log impression:", err);
  }
}

/** Record an ad click via backend (Redis dedup → Kafka → redirect) */
export async function logClick(ad) {
  try {
    const res = await fetch("/events/adclick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adId: ad?.adId || ad?.id,
        userId: `user-${Date.now()}`,
      }),
      redirect: "manual",
    });
    console.log("[Event] Click recorded:", res.status);
    return { status: res.status };
  } catch (err) {
    console.error("Failed to log click:", err);
  }
}