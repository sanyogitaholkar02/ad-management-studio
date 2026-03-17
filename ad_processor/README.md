# Ad Aggregator Service

## Overview
This is a fresh setup of the AD Aggregator project after a complete cleanup of the previous version. Starting anew to implement a cleaner and more efficient structure.

The **Ad Aggregator** is a high-performance backend system designed to track, process, and analyze ad click events in real time. It powers accurate ad performance measurement by collecting click data from users, validating it, and aggregating clicks per ad and campaign for reporting and analytics.

This system is suitable for websites and applications displaying ads (similar to platforms like Facebook Ads) and is designed to scale for millions of clicks while ensuring low latency user redirects.

---

## What’s Built

* **Ad Placement Service (Black Box):**
  Selects and serves ads to users, generating a unique `impressionId` to identify each ad impression. This impression ID is cached for idempotency and validation.

* **Click Processor Service:**
  Handles user clicks on ads by:

  1. Validating the click using cached impression IDs in Redis.
  2. Producing click events to a Kafka topic (`ad-clicks`) partitioned by `adId` for high throughput and scalability.
  3. Returning an HTTP 302 redirect response to send users to the advertiser’s website immediately, ensuring fast user experience.

* **Kafka Event Streaming:**
  Serves as the backbone message bus, reliably transporting click events to downstream processing.

* **Real-Time Aggregation (Flink):**
  Consumes click events from Kafka to aggregate click counts per ad and campaign within minute-level windows, updating an OLAP database for reporting.

* **Raw Click Storage (S3):**
  Stores all raw click events long-term for auditing, backfills, and batch processing.

* **Batch Reconciliation (Spark):**
  Runs periodically to detect and fix inconsistencies between raw and aggregated data, ensuring data accuracy and trustworthiness.

---

## System Architecture & Flow

```plaintext
Browser
   ↓
Load Balancer / API Gateway
   ↓
Ad Placement Service ↔ Ad DB
   ↓
Browser receives ad with impressionId
   ↓
User clicks ad
   ↓
Click Processor
   ├─ Validate (Redis cache for impressionId)
   ├─ Produce to Kafka (ad-clicks topic)
   └─ Return HTTP 302 redirect (advertiser’s URL)
         ↓
     User lands on advertiser site
```

1. **Ad Placement Service:**
   Generates and caches unique `impressionId` for each ad shown to the user.

2. **User Clicks Ad:**
   Click request hits the `/click` endpoint with the `impressionId`.

3. **Click Processor:**
   Validates the impression ID in Redis to prevent duplicate counting.
   Produces click event to Kafka for asynchronous processing.
   Immediately responds with an HTTP 302 redirect to the advertiser URL, ensuring low latency.

4. **Kafka Streams:**
   Serves as a durable, scalable pipeline for click events.

5. **Flink Streaming:**
   Aggregates click counts in real time and writes to the OLAP database.

6. **Raw Data Storage:**
   Raw clicks saved to S3 for audits and reprocessing.

7. **Batch Reconciliation:**
   Spark jobs detect and correct discrepancies for guaranteed accuracy.

---

## Technologies Used

* **Spring Boot:** REST API and click processing service
* **Redis:** Cache for idempotency and quick validation of impression IDs
* **Apache Kafka:** Scalable event streaming platform for click events
* **Apache Flink:** Real-time streaming analytics and aggregation
* **S3:** Durable storage for raw click data
* **Apache Spark:** Batch processing for reconciliation and data correction
* **OLAP Database:** High-performance analytics (e.g., ClickHouse, Druid)

---

## How to Run (Development)

1. Start Redis for caching impression IDs.
2. Start Kafka and create `ad-clicks` topic with partitions keyed by `adId`.
3. Run the Spring Boot application to serve ads and handle clicks.
4. Use Kafka consumer or Flink job to aggregate click events.
5. Set up S3 bucket for raw data storage and Spark job for reconciliation (optional).

---

## Summary

This project implements a scalable, fault-tolerant **Ad Click Aggregator** that captures user clicks, validates them for accuracy, streams them through Kafka, aggregates analytics in real time, and provides clean redirects for users. It balances speed, accuracy, and scalability — essential for modern ad tech platforms.

---

If you want me to help draft example Kafka or Flink configs or API docs, just ask!
