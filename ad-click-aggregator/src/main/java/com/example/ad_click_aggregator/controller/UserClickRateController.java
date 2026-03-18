package com.example.ad_click_aggregator.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API for querying user click rate analytics.
 * Reads pre-aggregated 1-minute windows from ClickHouse and rolls them up to 24
 * hours.
 */
@RestController
@RequestMapping("/analytics")
public class UserClickRateController {

    @Value("${spring.datasource.url}")
    private String clickhouseUrl;

    @Value("${spring.datasource.username}")
    private String clickhouseUser;

    @Value("${spring.datasource.password}")
    private String clickhousePassword;

    /**
     * GET /analytics/clickhouse-test
     * Diagnostic: tests ClickHouse connection and table existence.
     */
    @GetMapping("/clickhouse-test")
    public Map<String, Object> testClickHouse() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("url", clickhouseUrl);
        result.put("user", clickhouseUser);

        try (Connection conn = DriverManager.getConnection(clickhouseUrl, clickhouseUser, clickhousePassword)) {
            result.put("connection", "OK");

            // Test user_click_rate table
            try (PreparedStatement ps = conn.prepareStatement("SELECT count(*) as cnt FROM user_click_rate");
                    ResultSet rs = ps.executeQuery()) {
                rs.next();
                result.put("user_click_rate_rows", rs.getLong("cnt"));
            } catch (Exception e) {
                result.put("user_click_rate_error", e.getMessage());
            }

            // Test ads-agg table
            try (PreparedStatement ps = conn.prepareStatement("SELECT count(*) as cnt FROM `ads-agg`");
                    ResultSet rs = ps.executeQuery()) {
                rs.next();
                result.put("ads_agg_rows", rs.getLong("cnt"));
            } catch (Exception e) {
                result.put("ads_agg_error", e.getMessage());
            }

        } catch (Exception e) {
            result.put("connection", "FAILED: " + e.getMessage());
        }
        return result;
    }

    /**
     * GET /analytics/user-click-rate-24h
     * Returns all users' click rates for the last 24 hours.
     */
    @GetMapping("/user-click-rate-24h")
    public Map<String, Object> getAllUserClickRates24h() {
        String sql = """
                SELECT
                    userId,
                    SUM(clicks) AS total_clicks,
                    SUM(total_cost) AS total_cost,
                    MIN(window_start) AS first_window,
                    MAX(window_end) AS last_window,
                    COUNT(*) AS windows_count
                FROM user_click_rate
                WHERE window_start >= now() - INTERVAL 24 HOUR
                GROUP BY userId
                ORDER BY total_clicks DESC
                """;

        List<Map<String, Object>> users = new ArrayList<>();

        try (Connection conn = DriverManager.getConnection(clickhouseUrl, clickhouseUser, clickhousePassword);
                PreparedStatement ps = conn.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Map<String, Object> user = new LinkedHashMap<>();
                user.put("userId", rs.getString("userId"));
                user.put("totalClicks", rs.getLong("total_clicks"));
                user.put("totalCost", rs.getDouble("total_cost"));
                user.put("firstWindow", rs.getTimestamp("first_window").toString());
                user.put("lastWindow", rs.getTimestamp("last_window").toString());
                user.put("windowsCount", rs.getLong("windows_count"));
                users.add(user);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("error", e.getClass().getSimpleName() + ": " + e.getMessage());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timeRange", "last 24 hours");
        response.put("userCount", users.size());
        response.put("users", users);
        return response;
    }

    /**
     * GET /analytics/user-click-rate-24h/{userId}
     * Returns a specific user's click rate for the last 24 hours.
     */
    @GetMapping("/user-click-rate-24h/{userId}")
    public Map<String, Object> getUserClickRate24h(@PathVariable String userId) {
        String sql = """
                SELECT
                    SUM(clicks) AS total_clicks,
                    SUM(total_cost) AS total_cost,
                    MIN(window_start) AS first_window,
                    MAX(window_end) AS last_window,
                    COUNT(*) AS windows_count
                FROM user_click_rate
                WHERE userId = ?
                  AND window_start >= now() - INTERVAL 24 HOUR
                """;

        try (Connection conn = DriverManager.getConnection(clickhouseUrl, clickhouseUser, clickhousePassword);
                PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next() && rs.getLong("total_clicks") > 0) {
                    Map<String, Object> response = new LinkedHashMap<>();
                    response.put("userId", userId);
                    response.put("timeRange", "last 24 hours");
                    response.put("totalClicks", rs.getLong("total_clicks"));
                    response.put("totalCost", rs.getDouble("total_cost"));
                    response.put("firstWindow", rs.getTimestamp("first_window").toString());
                    response.put("lastWindow", rs.getTimestamp("last_window").toString());
                    response.put("windowsCount", rs.getLong("windows_count"));
                    return response;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("error", e.getClass().getSimpleName() + ": " + e.getMessage());
        }

        return Map.of("userId", userId, "message", "No click data found in the last 24 hours");
    }

    /**
     * GET /analytics/hardcode/user-click-rate-24h
     * Returns all users' click rates (hardcoded demo data).
     */
    @GetMapping("/hardcode/user-click-rate-24h")
    public Map<String, Object> getHardcodedAllUserClickRates24h() {

        List<Map<String, Object>> users = new ArrayList<>();

        Map<String, Object> user1 = new LinkedHashMap<>();
        user1.put("userId", "user-42");
        user1.put("totalClicks", 152);
        user1.put("totalCost", 380.50);
        user1.put("firstWindow", "2026-03-09 00:00:00.0");
        user1.put("lastWindow", "2026-03-09 23:59:00.0");
        user1.put("windowsCount", 48);
        users.add(user1);

        Map<String, Object> user2 = new LinkedHashMap<>();
        user2.put("userId", "user-77");
        user2.put("totalClicks", 98);
        user2.put("totalCost", 245.00);
        user2.put("firstWindow", "2026-03-09 01:15:00.0");
        user2.put("lastWindow", "2026-03-09 22:30:00.0");
        user2.put("windowsCount", 35);
        users.add(user2);

        Map<String, Object> user3 = new LinkedHashMap<>();
        user3.put("userId", "user-99");
        user3.put("totalClicks", 45);
        user3.put("totalCost", 112.25);
        user3.put("firstWindow", "2026-03-09 06:00:00.0");
        user3.put("lastWindow", "2026-03-09 17:45:00.0");
        user3.put("windowsCount", 20);
        users.add(user3);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timeRange", "last 24 hours");
        response.put("userCount", users.size());
        response.put("users", users);
        return response;
    }

    /**
     * GET /analytics/hardcode/user-click-rate-24h/{userId}
     * Returns a specific user's click rate (hardcoded demo data).
     */
    @GetMapping("/hardcode/user-click-rate-24h/{userId}")
    public Map<String, Object> getHardcodedUserClickRate24h(@PathVariable String userId) {

        if ("user-42".equals(userId)) {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("userId", "user-42");
            response.put("timeRange", "last 24 hours");
            response.put("totalClicks", 152);
            response.put("totalCost", 380.50);
            response.put("firstWindow", "2026-03-09 00:00:00.0");
            response.put("lastWindow", "2026-03-09 23:59:00.0");
            response.put("windowsCount", 48);
            return response;

        } else if ("user-77".equals(userId)) {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("userId", "user-77");
            response.put("timeRange", "last 24 hours");
            response.put("totalClicks", 98);
            response.put("totalCost", 245.00);
            response.put("firstWindow", "2026-03-09 01:15:00.0");
            response.put("lastWindow", "2026-03-09 22:30:00.0");
            response.put("windowsCount", 35);
            return response;

        } else if ("user-99".equals(userId)) {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("userId", "user-99");
            response.put("timeRange", "last 24 hours");
            response.put("totalClicks", 45);
            response.put("totalCost", 112.25);
            response.put("firstWindow", "2026-03-09 06:00:00.0");
            response.put("lastWindow", "2026-03-09 17:45:00.0");
            response.put("windowsCount", 20);
            return response;

        } else {
            return Map.of("userId", userId, "message", "No click data found in the last 24 hours");
        }
    }
}
