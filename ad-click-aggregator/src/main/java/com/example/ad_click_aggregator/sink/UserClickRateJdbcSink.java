package com.example.ad_click_aggregator.sink;

import com.example.ad_click_aggregator.entity.UserClickRateEntity;

import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.sink.RichSinkFunction;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.Timestamp;

public class UserClickRateJdbcSink extends RichSinkFunction<UserClickRateEntity> {

    private static final String INSERT_SQL = "INSERT INTO `user_click_rate` (userId, window_start, window_end, clicks, total_cost) VALUES (?, ?, ?, ?, ?)";

    private final String jdbcUrl;
    private final String user;
    private final String password;
    private transient Connection connection;

    public UserClickRateJdbcSink(String jdbcUrl, String user, String password) {
        this.jdbcUrl = jdbcUrl;
        this.user = user;
        this.password = password;
    }

    @Override
    public void open(Configuration parameters) throws Exception {
        connection = DriverManager.getConnection(jdbcUrl, user, password);
        System.out.println("[Flink Sink] Connected to ClickHouse (user_click_rate)");
    }

    @Override
    public void invoke(UserClickRateEntity value, Context context) {
        try (PreparedStatement ps = connection.prepareStatement(INSERT_SQL)) {
            ps.setString(1, value.getUserId());
            ps.setTimestamp(2, Timestamp.from(value.getWindowStart()));
            ps.setTimestamp(3, Timestamp.from(value.getWindowEnd()));
            ps.setLong(4, value.getClicks());
            ps.setDouble(5, value.getTotalCost());
            ps.executeUpdate();
            System.out.println("[Flink Sink] Saved user click rate: " + value);
        } catch (Exception e) {
            System.err.println("[Flink Sink] Failed to save user click rate: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public void close() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }
}
