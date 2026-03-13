package com.example.ad_click_aggregator;

import com.example.ad_click_aggregator.entity.AdAggregateEntity;
import com.example.ad_click_aggregator.entity.UserClickRateEntity;
import com.example.ad_click_aggregator.function.AdClickAggregateWindowFunction;
import com.example.ad_click_aggregator.function.UserClickRateWindowFunction;
import com.example.ad_click_aggregator.pojo.AdClick;
import com.example.ad_click_aggregator.sink.ClickHouseJdbcSink;
import com.example.ad_click_aggregator.sink.UserClickRateJdbcSink;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.api.java.utils.ParameterTool;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.TumblingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;

/**
 * Standalone Flink job entry point.
 * This class is submitted to the Docker Flink cluster as a JAR.
 *
 * Usage (programArgs):
 * --kafka.bootstrap.servers host:port
 * --kafka.topic topic-name
 * --kafka.group.id group
 * --clickhouse.url jdbc:clickhouse://host:port/db
 * --clickhouse.user user
 * --clickhouse.password pass
 */
public class FlinkJobMain {

    public static void main(String[] args) throws Exception {

        ParameterTool params = ParameterTool.fromArgs(args);

        String bootstrapServers = params.get("kafka.bootstrap.servers", "localhost:9092");
        String topic = params.get("kafka.topic", "ad-click-topic-1");
        String groupId = params.get("kafka.group.id", "flink-ad-clicks-group");
        String clickhouseUrl = params.get("clickhouse.url", "jdbc:clickhouse://localhost:8123/default");
        String clickhouseUser = params.get("clickhouse.user", "default");
        String clickhousePassword = params.get("clickhouse.password", "");

        System.out.println("=== Flink Job Starting ===");
        System.out.println("  Kafka: " + bootstrapServers + " / " + topic);
        System.out.println("  ClickHouse: " + clickhouseUrl);

        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.enableCheckpointing(10000);

        // Kafka Source
        KafkaSource<String> source = KafkaSource.<String>builder()
                .setBootstrapServers(bootstrapServers)
                .setTopics(topic)
                .setGroupId(groupId)
                .setValueOnlyDeserializer(new SimpleStringSchema())
                .build();

        DataStream<String> stream = env.fromSource(
                source, WatermarkStrategy.noWatermarks(), "Kafka Source");

        // Deserialize
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());

        DataStream<AdClick> clicks = stream
                .map(json -> {
                    System.out.println("[Flink] Received: " + json);
                    return mapper.readValue(json, AdClick.class);
                });

        // Pipeline 1: Ad Campaign Aggregation
        DataStream<AdAggregateEntity> adAggregated = clicks
                .keyBy(click -> click.getAdId() + "_" + click.getCampaignId())
                .window(TumblingProcessingTimeWindows.of(Time.minutes(1)))
                .process(new AdClickAggregateWindowFunction());

        adAggregated.addSink(
                new ClickHouseJdbcSink(clickhouseUrl, clickhouseUser, clickhousePassword))
                .name("ClickHouse Sink: ads-agg");

        // Pipeline 2: User Click Rate
        DataStream<UserClickRateEntity> userClickRates = clicks
                .filter(click -> click.getUserId() != null && !click.getUserId().isEmpty())
                .keyBy(AdClick::getUserId)
                .window(TumblingProcessingTimeWindows.of(Time.minutes(1)))
                .process(new UserClickRateWindowFunction());

        userClickRates.addSink(
                new UserClickRateJdbcSink(clickhouseUrl, clickhouseUser, clickhousePassword))
                .name("ClickHouse Sink: user_click_rate");

        env.execute("Ad Click Aggregation Job");
    }
}
