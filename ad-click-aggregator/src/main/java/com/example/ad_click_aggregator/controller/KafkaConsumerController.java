package com.example.ad_click_aggregator.controller;

import java.util.List;
import java.util.Map;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.ad_click_aggregator.component.KafkaConsumer;
import com.example.ad_click_aggregator.pojo.AdClick;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
public class KafkaConsumerController {

    private final KafkaConsumer consumer;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public KafkaConsumerController(KafkaConsumer consumer, KafkaTemplate<String, String> kafkaTemplate) {
        this.consumer = consumer;
        this.kafkaTemplate = kafkaTemplate;
    }

    @GetMapping("/ad-aggregates")
    public List<AdClick> getAggregates() {
        return consumer.getLatestMessages();
    }

    @PostMapping("/kafka-produce")
    public Map<String, String> produceMessage(@RequestBody AdClick adClick) throws Exception {
        String json = objectMapper.writeValueAsString(adClick);
        kafkaTemplate.send("ad-click-topic-1", adClick.getAdId(), json);
        return Map.of("status", "sent", "message", json);
    }

    @GetMapping("/kafka-test")
    public String sendTestMessage() {
        String testJson = "{\"adId\":\"test-ad-1\",\"campaignId\":\"camp-1\",\"cost\":1.5,\"idempotencyKey\":\"key-1\"}";
        kafkaTemplate.send("ad-click-topic-1", testJson);
        return "Test message sent! Check /ad-aggregates in a few seconds.";
    }

}
