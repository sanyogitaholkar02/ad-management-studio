package com.example.ad_click_aggregator.sink;

import com.example.ad_click_aggregator.entity.AdAggregateEntity;

import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.sink.RichSinkFunction;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.Timestamp;

/**
 * Flink sink that writes AdAggregateEntity records directly to ClickHouse via
 * JDBC.
 */
public class ClickHouseJdbcSink extends RichSinkFunction<AdAggregateEntity> {

    private static final String INSERT_SQL = "INSERT INTO `ads-agg` (id, window_start, adId, campaignId, clicks, revenue) VALUES (?, ?, ?, ?, ?, ?)";

    private final String jdbcUrl;
    private final String user;
    private final String password;
    private transient Connection connection;

    public ClickHouseJdbcSink(String jdbcUrl, String user, String password) {
        this.jdbcUrl = jdbcUrl;
        this.user = user;
        this.password = password;
    }

    @Override
    public void open(Configuration parameters) throws Exception {
        connection = DriverManager.getConnection(jdbcUrl, user, password);
        System.out.println("[Flink Sink] Connected to ClickHouse");
    }

    @Override
    public void invoke(AdAggregateEntity value, Context context) {
        try (PreparedStatement ps = connection.prepareStatement(INSERT_SQL)) {
            ps.setLong(1, System.nanoTime());
            ps.setTimestamp(2, Timestamp.from(value.getWindowStart()));
            ps.setString(3, value.getAdId());
            ps.setString(4, value.getCampaignId());
            ps.setLong(5, value.getClicks());
            ps.setDouble(6, value.getRevenue());
            ps.executeUpdate();
            System.out.println("[Flink Sink] Saved: adId=" + value.getAdId()
                    + " clicks=" + value.getClicks() + " revenue=" + value.getRevenue());
        } catch (Exception e) {
            System.err.println("[Flink Sink] Failed to save: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public void close() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
            System.out.println("[Flink Sink] ClickHouse connection closed");
        }
    }
}
