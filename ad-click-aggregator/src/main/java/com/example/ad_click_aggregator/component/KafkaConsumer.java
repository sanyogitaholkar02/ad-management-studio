package com.example.ad_click_aggregator.component;

import com.example.ad_click_aggregator.pojo.AdClick;
import com.example.ad_click_aggregator.repo.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import jakarta.annotation.PostConstruct;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.event.ListenerContainerIdleEvent;
import org.springframework.context.event.EventListener;
import org.springframework.kafka.event.ConsumerStartedEvent;
import org.springframework.stereotype.Component;

@Component
public class KafkaConsumer {

    private final ClickAggregatorRepo repository;
    private final ObjectMapper mapper;

    public KafkaConsumer(ClickAggregatorRepo repository) {
        this.repository = repository;
        this.mapper = new ObjectMapper();
        this.mapper.registerModule(new JavaTimeModule());
    }

    @PostConstruct
    public void init() {
        System.out.println("=== KafkaConsumer bean initialized ===");
    }

    @EventListener
    public void onKafkaConsumerStarted(ConsumerStartedEvent event) {
        System.out.println("=== Kafka consumer STARTED: " + event + " ===");
    }

    @EventListener
    public void onKafkaIdle(ListenerContainerIdleEvent event) {
        System.out.println("=== Kafka listener idle (no messages): " + event.getListenerId() + " ===");
    }

    private final List<AdClick> latestMessages = new CopyOnWriteArrayList<>();

    @KafkaListener(topics = "ad-click-topic-1")
    public void consume(String message) {
        System.out.println("Raw Kafka message: " + message);
        try {
            AdClick adClick = mapper.readValue(message, AdClick.class);
            System.out.println("Deserialized: " + adClick);
            latestMessages.add(adClick);
        } catch (Exception e) {
            System.err.println("Failed to deserialize message: " + message);
            e.printStackTrace();
        }
    }

    public List<AdClick> getLatestMessages() {
        System.out.println("Inside this method");
        return List.copyOf(latestMessages);
    }

}
