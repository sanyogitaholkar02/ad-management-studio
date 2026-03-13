// ============================================
//  Analytics Service — Kafka / Flink / ClickHouse (port 8086)
// ============================================

const BASE = "";  // proxied via Vite

/** Health check */
export async function analyticsHealthCheck() {
    const res = await fetch(`${BASE}/flink/start`);
    return res.text();
}

/** Submit a Flink job */
export async function submitFlinkJob() {
    const res = await fetch(`${BASE}/flink/submit-job`);
    return res.text();
}

/** Get latest consumed Kafka messages (ad aggregates) */
export async function fetchAdAggregates() {
    const res = await fetch(`${BASE}/ad-aggregates`);
    if (!res.ok) throw new Error(`Failed to fetch aggregates: ${res.status}`);
    return res.json();
}

/** Produce an ad-click event to Kafka */
export async function produceAdClickEvent(adClick) {
    const res = await fetch(`${BASE}/kafka-produce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adClick),
    });
    if (!res.ok) throw new Error(`Failed to produce event: ${res.status}`);
    return res.text();
}

/** Send a hardcoded test message to Kafka */
export async function sendKafkaTestMessage() {
    const res = await fetch(`${BASE}/kafka-test`);
    return res.text();
}

/** Test ClickHouse connectivity */
export async function testClickHouse() {
    const res = await fetch(`${BASE}/analytics/clickhouse-test`);
    return res.text();
}

/** Get all users' 24h click rates */
export async function fetchAllUserClickRates() {
    const res = await fetch(`${BASE}/analytics/hardcode/user-click-rate-24h`);
    if (!res.ok) throw new Error(`Failed to fetch click rates: ${res.status}`);
    return res.json();
}

/** Get specific user's 24h click rate */
export async function fetchUserClickRate(userId) {
    const res = await fetch(`${BASE}/analytics/hardcode/user-click-rate-24h/${userId}`);
    if (!res.ok) throw new Error(`Failed to fetch click rate: ${res.status}`);
    return res.json();
}
