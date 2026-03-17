// package com.example.service;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.kafka.core.KafkaTemplate;
// import org.springframework.stereotype.Service;

// @Service
// public class KafkaProducerService {

// @Autowired
// private final KafkaTemplate<String, Ad> kafkaTemplate;
// private static final String TOPIC = "ad-click-topic-1";

// public KafkaProducerService(KafkaTemplate<String, String> kafkaTemplate) {
// this.kafkaTemplate = kafkaTemplate;
// }

// public void sendMessage(String message) {
// kafkaTemplate.send(TOPIC, message);
// System.out.println("Sent: " + message);
// }

// }
