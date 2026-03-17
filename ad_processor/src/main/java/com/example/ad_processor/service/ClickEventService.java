package com.example.ad_processor.service;

import java.sql.Timestamp;
import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.example.ad_processor.entity.Ads;
import com.example.ad_processor.exception.AdNotFoundException;
import com.example.ad_processor.exception.KafkaPublishException;
import com.example.ad_processor.pojo.AdClick;
import com.example.ad_processor.pojo.ClickEventRequest;
import com.example.ad_processor.repo.AdvertismentRepo;
import com.example.ad_processor.repo.ClickEventRepo;

@Service
public class ClickEventService {

    private static final Logger log = LoggerFactory.getLogger(ClickEventService.class);

    private final ClickEventRepo repository;
    private final AdvertismentRepo repo;
    private final RedisTemplate<String, String> redisTemplate;
    private final KafkaTemplate<String, AdClick> kafkaTemplate;

    public static final String TOPIC = "ad-click-topic-1";

    public ClickEventService(RedisTemplate<String, String> redisTemplate,
            KafkaTemplate<String, AdClick> kafkaTemplate, ClickEventRepo repository, AdvertismentRepo repo) {
        this.repository = repository;
        this.redisTemplate = redisTemplate;
        this.kafkaTemplate = kafkaTemplate;
        this.repo = repo;
    }

    public boolean isDuplicate(String idempotencyKey) {
        try {
            String redisKey = "ad-click-processor:idempotency:" + idempotencyKey;
            return Boolean.TRUE.equals(redisTemplate.hasKey(redisKey));
        } catch (RedisConnectionFailureException ex) {
            log.error("Redis connection failed during duplicate check for key: {}", idempotencyKey, ex);
            throw ex; // GlobalExceptionHandler will catch this as 503
        }
    }

    public void markProcessed(String idempotencyKey) {
        try {
            String redisKey = "ad-click-processor:idempotency:" + idempotencyKey;
            Boolean exists = redisTemplate.hasKey(redisKey);
            if (exists == null || !exists) {
                redisTemplate.opsForValue().set(redisKey, "processed", Duration.ofHours(1));
                log.info("Marked idempotencyKey as processed: {}", idempotencyKey);
            } else {
                log.info("IdempotencyKey already processed, skipping: {}", idempotencyKey);
            }
        } catch (RedisConnectionFailureException ex) {
            log.error("Redis connection failed while marking key processed: {}", idempotencyKey, ex);
            throw ex;
        }
    }

    public void produceToKafka(AdClick adClick) {
        try {
            kafkaTemplate.send(TOPIC, adClick);
            log.info("Produced AdClick to Kafka topic '{}': adId={}", TOPIC, adClick.getAdId());
        } catch (Exception ex) {
            log.error("Failed to produce AdClick to Kafka topic '{}': adId={}", TOPIC, adClick.getAdId(), ex);
            throw new KafkaPublishException(TOPIC, ex);
        }
    }

    public String processClickRequest(ClickEventRequest request) {

        // 1. Validate adId is provided
        if (request.getAdId() == null || request.getAdId().isBlank()) {
            throw new IllegalArgumentException("adId is required to process a click event");
        }

        // 2. Lookup the ad from DB — throws AdNotFoundException if not found
        Ads ads = repo.findByAdID(request.getAdId());
        if (ads == null) {
            throw new AdNotFoundException(request.getAdId());
        }

        String redirectUrl = ads.getRedirectURL();
        log.info("Processing click for adId={}, redirecting to: {}", request.getAdId(), redirectUrl);

        // 3. Create POJO for Kafka
        AdClick adClick = new AdClick();
        adClick.setAdId(request.getAdId());
        adClick.setIdempotencyKey(request.getIdempotencyKey());
        adClick.setTimestamp(new Timestamp(System.currentTimeMillis()));

        // 4. Produce to Kafka (throws KafkaPublishException on failure)
        produceToKafka(adClick);

        // 5. Mark processed in Redis (throws RedisConnectionFailureException on
        // failure)
        markProcessed(request.getIdempotencyKey());

        return redirectUrl;
    }
}
