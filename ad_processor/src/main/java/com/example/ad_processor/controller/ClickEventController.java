package com.example.ad_processor.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.ad_processor.exception.DuplicateClickException;
import com.example.ad_processor.pojo.ClickEventRequest;
import com.example.ad_processor.service.ClickEventService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/events")
public class ClickEventController {

    private static final Logger log = LoggerFactory.getLogger(ClickEventController.class);

    private final ClickEventService clickService;

    ClickEventController(ClickEventService clickService) {
        this.clickService = clickService;
    }

    @PostMapping("adclick")
    public ResponseEntity<?> postMethodName(@Valid @RequestBody ClickEventRequest request) {

        log.info("POST /events/adclick — adId={}, idempotencyKey={}", request.getAdId(),
                request.getIdempotencyKey());

        if (clickService.isDuplicate(request.getIdempotencyKey())) {
            log.info("Duplicate click detected for idempotencyKey={}", request.getIdempotencyKey());
            throw new DuplicateClickException(request.getIdempotencyKey(), request.getRedirectUrl());
        }

        String url = clickService.processClickRequest(request);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Location", url);
        return ResponseEntity.status(302).headers(headers).build();
    }

    @PostMapping("adclick/bulk")
    public ResponseEntity<?> processBulkClicks(@RequestBody List<ClickEventRequest> requests) {

        log.info("POST /events/adclick/bulk — processing {} click events", requests.size());

        int processed = 0;
        int duplicates = 0;
        int failed = 0;
        List<Map<String, String>> results = new ArrayList<>();

        for (ClickEventRequest request : requests) {
            Map<String, String> result = new LinkedHashMap<>();
            result.put("adId", request.getAdId());
            result.put("idempotencyKey", request.getIdempotencyKey());
            result.put("userId", request.getUserId());

            try {
                if (clickService.isDuplicate(request.getIdempotencyKey())) {
                    result.put("status", "DUPLICATE");
                    result.put("redirectUrl", request.getRedirectUrl());
                    duplicates++;
                } else {
                    String url = clickService.processClickRequest(request);
                    result.put("status", "PROCESSED");
                    result.put("redirectUrl", url);
                    processed++;
                }
            } catch (Exception ex) {
                result.put("status", "FAILED");
                result.put("error", ex.getMessage());
                failed++;
                log.error("Failed to process click for adId={}: {}", request.getAdId(), ex.getMessage());
            }

            results.add(result);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("total", requests.size());
        response.put("processed", processed);
        response.put("duplicates", duplicates);
        response.put("failed", failed);
        response.put("results", results);

        log.info("Bulk click processing complete: total={}, processed={}, duplicates={}, failed={}",
                requests.size(), processed, duplicates, failed);

        return ResponseEntity.ok(response);
    }
}
