import { defineConfig } from "vite";

export default defineConfig({
    server: {
        port: 5173,
        proxy: {
            // Ad Processor Service (port 8085)
            "/ads": {
                target: "http://localhost:8085",
                changeOrigin: true,
            },
            "/events": {
                target: "http://localhost:8085",
                changeOrigin: true,
            },
            // Analytics / Kafka / Flink service (port 8086)
            "/flink": {
                target: "http://localhost:8086",
                changeOrigin: true,
            },
            "/analytics": {
                target: "http://localhost:8086",
                changeOrigin: true,
            },
            "/ad-aggregates": {
                target: "http://localhost:8086",
                changeOrigin: true,
            },
            "/kafka-produce": {
                target: "http://localhost:8086",
                changeOrigin: true,
            },
            "/kafka-test": {
                target: "http://localhost:8086",
                changeOrigin: true,
            },
            // CTR Prediction + A/B Testing Service — Django (port 8000)
            "/api": {
                target: "http://localhost:8000",
                changeOrigin: true,
            },
        },
    },
});
