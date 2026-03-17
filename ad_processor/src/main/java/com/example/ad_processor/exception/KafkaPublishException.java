package com.example.ad_processor.exception;

public class KafkaPublishException extends RuntimeException {

    public KafkaPublishException(String topic, Throwable cause) {
        super("Failed to publish message to Kafka topic: " + topic, cause);
    }
}
