# 🚀 Ad Management Studio

> A production-grade, distributed ad-tech platform built with microservices architecture — engineered for **real-time click aggregation**, **ML-powered CTR prediction**, **A/B experimentation**, and **full-stack analytics**.

---

## 📐 System Architecture (High-Level)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          AD MANAGEMENT STUDIO                                    │
│                                                                                  │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────┐   ┌────────────┐  │
│  │   React UI   │   │  Ad Processor    │   │ Click          │   │  CTR        │  │
│  │   (Vite)     │──▶│  (Spring Boot)   │──▶│ Aggregator     │   │ Prediction  │  │
│  │              │   │                  │   │ (Flink+Kafka)  │   │ (Django)    │  │
│  └──────┬───────┘   └──────────────────┘   └───────┬────────┘   └─────┬──────┘  │
│         │                                          │                  │          │
│         │           ┌──────────────────┐           │                  │          │
│         └──────────▶│  AB Testing API  │◀──────────┘                  │          │
│                     │  (Django)        │──────────────────────────────▶│          │
│                     └──────────────────┘                              │          │
│                                                                      │          │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌─────────────────┐  │          │
│  │  Kafka   │  │ClickHouse │  │    MySQL      │  │  Redis (Cache)  │  │          │
│  │ (Broker) │  │  (OLAP)   │  │  (RDBMS)     │  │                 │  │          │
│  └──────────┘  └───────────┘  └──────────────┘  └─────────────────┘  │          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Microservices Breakdown

| Service | Tech Stack | Port | Role |
|---------|-----------|------|------|
| **Ad Processor** | Spring Boot 4, Java 21, Kafka, Redis | `8086` | Ad serving, click handling, Kafka producer |
| **Ad Click Aggregator** | Spring Boot 4, Flink 1.18, Kafka, ClickHouse | `8086` | Real-time click aggregation, windowed analytics |
| **CTR Prediction Service** | Django 6, DRF, scikit-learn, SQLAlchemy | `8000` | ML-based CTR prediction, model monitoring |
| **AB Testing API** | Django 6, DRF | `8000` | Deterministic experiment assignment |
| **Event Logging** | Django 6, DRF, MySQL | `8000` | Impression and click event tracking |
| **Frontend Dashboard** | React 19, Vite 7, React Router 7 | `5173` | Full-stack analytics UI |

---

## 🏗️ 1. Ad Click Aggregator (Java / Spring Boot + Flink)

### What It Does
A high-performance, distributed pipeline that captures ad click events, streams them through Kafka, and aggregates click metrics per ad and campaign in real time using Apache Flink windowed processing — backed by ClickHouse for OLAP analytics.

### Architecture & Workflow

```
User Click → Click Processor → Kafka (ad-click-topic) → Flink Stream Processing
                   │                                           │
                   ├─ Validate (Redis)              ┌─────────┴─────────┐
                   ├─ HTTP 302 Redirect             │  Windowed         │
                   └─ Produce Event                 │  Aggregation      │
                                                    │  (per Ad/Campaign)│
                                                    └─────────┬─────────┘
                                                              │
                                                        ClickHouse
                                                     (OLAP Analytics DB)
```

**Step-by-step flow:**

1. **Ad Placement Service** generates a unique `impressionId` per ad impression, cached in Redis for idempotency.
2. **User clicks an ad** → request hits the `/click` endpoint with `impressionId`.
3. **Click Processor** validates the impression in Redis to prevent duplicate counting.
4. Click event is **produced to Kafka** (`ad-click-topic`) partitioned by `adId` for ordered, scalable processing.
5. **HTTP 302 redirect** returned immediately — user lands on the advertiser's site with zero latency.
6. **Flink Streaming Job** consumes from Kafka, applies minute-level tumbling windows, and aggregates:
   - **Per-Ad click counts** (`AdClickAggregateWindowFunction`)
   - **Per-User click rates** (`UserClickRateWindowFunction`)
7. Aggregated results written to **ClickHouse** via custom JDBC sinks for sub-second analytical queries.
8. **Raw click events** stored in S3 for audit trails and batch reprocessing.
9. **Spark reconciliation** jobs run periodically to detect and fix drift between raw and aggregated data.

### Scalability & Distribution

| Dimension | How It Scales |
|-----------|---------------|
| **Kafka Partitioning** | Events partitioned by `adId` — add partitions horizontally for higher throughput |
| **Flink Parallelism** | JobManager / TaskManager architecture supports scaling to 100s of task slots |
| **ClickHouse** | Column-oriented OLAP DB designed for petabyte-scale analytics with sub-second queries |
| **Kafka Consumer Groups** | `concurrency=3` listeners with manual acknowledgment for at-least-once delivery |
| **Connection Pooling** | Hibernate batch inserts (`batch_size=500`) with ordered inserts for write efficiency |
| **Dockerized Cluster** | Flink cluster (JobManager + TaskManager) and ClickHouse run in Docker Compose |

### Key Components

```
ad-click-aggregator/
├── FlinkJobMain.java                   # Standalone Flink job entry point
├── component/
│   ├── FlinkJobRunner.java             # Submits jobs to Flink cluster via REST
│   └── KafkaConsumer.java              # Spring Kafka concurrent listener
├── config/
│   └── KafkaConfig.java               # Consumer/Producer factory configuration
├── controller/
│   ├── FlinkController.java            # REST endpoints for Flink job management
│   ├── KafkaConsumerController.java    # REST control of Kafka consumption
│   └── UserClickRateController.java    # Click rate analytics endpoints
├── entity/
│   ├── AdAggregateEntity.java          # JPA entity for aggregated clicks
│   └── UserClickRateEntity.java        # JPA entity for user click rates
├── function/
│   ├── AdClickAggregateWindowFunction.java   # Flink window: aggregate by ad
│   └── UserClickRateWindowFunction.java      # Flink window: rate per user
├── sink/
│   ├── ClickHouseJdbcSink.java         # Custom Flink sink → ClickHouse
│   └── UserClickRateJdbcSink.java      # Custom Flink sink → click rates
└── docker-compose.yaml                 # ClickHouse + Flink cluster
```

### Tech Stack

- **Java 21** + **Spring Boot 4.0.3**
- **Apache Kafka** — distributed event streaming (partitioned by `adId`)
- **Apache Flink 1.18** — stateful stream processing with windowed aggregation
- **ClickHouse** — columnar OLAP database for real-time analytics
- **Redis** — impression ID caching and idempotency validation
- **Docker Compose** — orchestrates Flink cluster + ClickHouse
- **Spring Data JPA** + **Lombok** — entity management
- **Jackson** — JSON serialization

---

## 🤖 2. CTR Prediction Service (Python / Django)

### What It Does
A real-time **Click-Through Rate (CTR) prediction engine** that scores ads for each user using a trained ML model, contextual features, and behavioral signals. It selects the highest-performing ad per user and persists all predictions for analytics.

### Architecture & Workflow

```
POST /api/ctr/predict/
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    CTR PREDICTION PIPELINE                   │
│                                                             │
│  1. Deserialize & validate (DRF serializers)                │
│  2. Build 12-element feature vector from:                   │
│     • User profile (interests, search history, price prefs) │
│     • Context (device, time, day, country)                  │
│     • Recent ad interactions (CTR history, relevance)        │
│  3. ML model inference (scikit-learn / joblib .pkl)          │
│  4. Ad catalog matching (interest → ad keywords)            │
│  5. CTR scoring per ad (base_score × weights + boosts)      │
│  6. Rank by CTR → select best ad                            │
│  7. Persist: user_context_data + ad_predictions → MySQL     │
│  8. Log to PredictionLog (Django ORM)                       │
│  9. Return ranked predictions with latency metrics          │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
  { user_id, chosen_ad, predictions[], total_latency_ms }
```

**Step-by-step flow:**

1. **Request arrives** with `user_id`, `profile` (interests, search history, recent ads, price preferences), and `context` (device, time, country).
2. **Feature engineering** — 12-element numeric vector built from profile and context signals:
   - Behavioral: # interests, # search items, # recent ads, avg CTR rate, relevance ratio
   - Contextual: device type (encoded), hour of day, day of week
3. **Model inference** — scikit-learn model loaded via `joblib` produces a base CTR probability.
4. **Ad catalog matching** — user keywords matched against ad catalog using set intersection for relevance scoring.
5. **CTR scoring formula** per ad:
   - With historical data: `(base_score × 0.4) + (historical_ctr × 0.4) + (relevance × 0.05) + relevance_boost`
   - Without: `(base_score × 0.5) + (relevance × 0.1)`
6. Predictions **ranked by CTR** (descending), best ad selected.
7. **Non-blocking persistence** — user context data, ad predictions, and prediction logs saved to MySQL via SQLAlchemy and Django ORM.
8. **Response** includes chosen ad, ranked predictions, and total latency in milliseconds.

### Scalability & Distribution

| Dimension | How It Scales |
|-----------|---------------|
| **Stateless API** | Django REST framework — horizontally scalable behind any load balancer |
| **Model Serving** | Singleton model loaded once at startup (`joblib.load`) — zero per-request I/O |
| **Database Layer** | Dual ORM strategy: Django ORM for logging, SQLAlchemy with connection pooling (`pool_size=5`, `max_overflow=10`) for persistence |
| **Non-blocking Writes** | Prediction persistence wrapped in try/except — never blocks the prediction response |
| **Feature Engineering** | Pure Python, no external calls — sub-millisecond feature vector construction |
| **Connection Recycling** | SQLAlchemy `pool_recycle=3600` prevents stale MySQL connections in long-running processes |
| **WSGI/ASGI** | Ships with both `wsgi.py` and `asgi.py` — deploy with Gunicorn or Uvicorn for concurrency |

### Key Components

```
ctr_prediction_service/
├── ctr_api/                            # Core CTR prediction app
│   ├── views.py                        # API endpoints (predict, monitoring, history)
│   ├── features.py                     # 12-feature vector builder
│   ├── serializers.py                  # DRF request validation
│   ├── model.py                        # PredictionLog Django model
│   ├── services/
│   │   ├── ctr_model_service.py        # ML model loading & inference (joblib)
│   │   ├── ad_catalog_service.py       # Interest → Ad matching engine
│   │   ├── user_context_service.py     # Persist predictions to MySQL (SQLAlchemy)
│   │   └── logging_service.py          # Prediction event logging
│   ├── db/
│   │   ├── database.py                 # SQLAlchemy engine + session factory
│   │   ├── models.py                   # UserContextData, UserAdPrediction, AdPrediction
│   │   └── create_tables.py            # Schema initialization
│   └── static/model_monitoring/        # Performance & drift history (JSON)
├── ab_testing_api/                     # A/B experiment assignment
│   ├── experiment.py                   # Deterministic hash-based variant assignment
│   ├── views.py                        # POST /api/ab/experiment/assign
│   └── models.py                       # ExperimentLog
└── event_logging/                      # Impression & click tracking
    ├── views.py                        # POST /log/impression, /log/click
    └── models.py                       # ImpressionLog, ClickLog
```

### Tech Stack

- **Python 3** + **Django 6.0** + **Django REST Framework**
- **scikit-learn** + **joblib** — ML model training and inference
- **NumPy** — feature vector computation
- **SQLAlchemy** — connection-pooled MySQL persistence with ORM
- **MySQL** — relational storage for predictions, experiments, and event logs
- **Django ORM** — secondary persistence for prediction logging

---

## 🧪 3. A/B Testing Engine

### What It Does
Deterministic, hash-based experiment assignment that ensures every user consistently sees the same model variant across requests — critical for unbiased CTR experiment measurement.

### How It Works

```
POST /api/ab/experiment/assign
  { user_id, experiment_key }
       │
       ▼
  MD5(user_id) % 100 → bucket
       │
       ▼
  Match bucket to variant traffic split
       │
       ▼
  { variant: "B", model_version: "ctr_model_v2" }
       │
       ▼
  Log to ExperimentLog table
```

- **Deterministic routing** — `MD5(user_id) % 100` guarantees stable variant assignment
- **Configurable traffic splits** — e.g., 50/50 between `ctr_model_v1` and `ctr_model_v2`
- **Indexed logging** — `ExperimentLog` table indexed on `user_id` and `experiment_key` for fast analytics
- **Integration** — model version from A/B flows directly into the CTR prediction pipeline

---

## 🖥️ 4. Frontend Dashboard (React)

### What It Does
A full-featured analytics dashboard built with React 19 and Vite 7, providing real-time visibility into every layer of the ad platform.

### Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/` | **Home** | System overview and navigation |
| `/feed` | **Ad Feed** | Live ad feed simulation |
| `/ads/manage` | **Ad Manager** | CRUD operations for ad campaigns |
| `/ctr` | **CTR Prediction** | Interactive prediction testing with full request builder |
| `/experiments` | **Experiments** | A/B test management and variant assignment |
| `/events` | **Event Log** | Real-time impression and click event stream |

### Tech Stack

- **React 19** + **React Router 7** — SPA with client-side routing
- **Vite 7** — instant HMR dev server and optimized production builds
- **Vanilla CSS** — custom design system (44 KB stylesheet)

---

## 📡 API Reference

### CTR Prediction Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ctr/predict/` | Predict CTR for a user, return ranked ads |
| `GET` | `/api/ctr/predict/{user_id}/` | Retrieve prediction history for a user |
| `GET` | `/api/ctr/model/` | Current model info (version, training date) |
| `GET` | `/api/ctr/model/monitoring/` | Model monitoring dashboard (latest metrics + drift) |
| `GET` | `/api/ctr/model/monitoring/performance/` | Full performance history |
| `GET` | `/api/ctr/model/monitoring/drift/` | Full drift detection history |
| `GET` | `/api/ctr/model/monitoring/registry/` | Model registry (all versions) |

### A/B Testing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ab/experiment/assign` | Assign user to experiment variant |
| `GET` | `/api/ab/variant/` | Get current variant (simple) |

### Event Logging Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/log/impression` | Log an ad impression |
| `POST` | `/log/click` | Log an ad click |

### Click Aggregator Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/data` | Data from Spring Boot |
| `*` | `/api/flink/*` | Flink job management (submit, status) |
| `*` | `/api/kafka/*` | Kafka consumer control |
| `*` | `/api/click-rates/*` | User click rate analytics |

---

## 🔗 End-to-End Distributed Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      COMPLETE REQUEST LIFECYCLE                         │
│                                                                         │
│  1. User visits page                                                    │
│     └─▶ React Dashboard renders ad feed                                 │
│                                                                         │
│  2. Ad Placement Service selects ads                                    │
│     └─▶ Generates impressionId, caches in Redis                         │
│     └─▶ Event Logging: POST /log/impression                             │
│                                                                         │
│  3. A/B Testing assigns model variant                                   │
│     └─▶ POST /api/ab/experiment/assign → { variant, model_version }     │
│                                                                         │
│  4. CTR Prediction scores each ad                                       │
│     └─▶ POST /api/ctr/predict/                                          │
│     └─▶ Feature vector → ML model → Ad matching → Rankings              │
│     └─▶ Persist to MySQL (user_context + predictions)                   │
│                                                                         │
│  5. User clicks best-ranked ad                                          │
│     └─▶ Click Processor validates in Redis                              │
│     └─▶ Produces event to Kafka (ad-click-topic)                        │
│     └─▶ HTTP 302 redirect to advertiser                                 │
│     └─▶ Event Logging: POST /log/click                                  │
│                                                                         │
│  6. Flink processes Kafka stream                                        │
│     └─▶ Windowed aggregation per ad / campaign                          │
│     └─▶ Writes to ClickHouse (OLAP analytics)                           │
│                                                                         │
│  7. Raw clicks stored in S3 for audit                                   │
│     └─▶ Spark reconciliation corrects drift                             │
│                                                                         │
│  8. Dashboard polls analytics endpoints                                 │
│     └─▶ Click rates, model monitoring, experiment metrics               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Full Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Vite 7, React Router 7 | SPA dashboard with real-time analytics |
| **API Gateway** | Spring Boot 4 (Java 21) | Ad serving, click processing, REST APIs |
| **ML Service** | Django 6, DRF, scikit-learn, NumPy | CTR prediction, model serving |
| **Event Streaming** | Apache Kafka | Distributed, partitioned event pipeline |
| **Stream Processing** | Apache Flink 1.18 | Stateful windowed aggregation |
| **OLAP Database** | ClickHouse | Sub-second analytical queries at scale |
| **RDBMS** | MySQL | Transactional storage (predictions, experiments, logs) |
| **Caching** | Redis | Impression ID validation, idempotency |
| **Batch Processing** | Apache Spark | Reconciliation and data correction |
| **Object Storage** | AWS S3 | Raw click event archival |
| **Containerization** | Docker Compose | Flink cluster + ClickHouse orchestration |
| **ORM** | SQLAlchemy + Django ORM | Dual persistence layer with connection pooling |
| **Serialization** | Jackson (Java), DRF Serializers (Python) | Request/response validation |
| **Build** | Maven (Java), pip (Python), npm (JS) | Multi-language build tooling |

---

## 📊 Database Schema

### MySQL (Transactional)

```sql
-- CTR Prediction Persistence
user_context_data       -- Full request payload: profile + context + result
user_ad_prediction      -- Prediction summary: user_id, chosen_ad, latency
ad_prediction           -- Individual ad scores: ad_id, ctr, category (FK → user_ad_prediction)
ctr_api_predictionlog   -- Per-ad prediction log: request_id, ad_id, ctr, model_version, latency

-- A/B Testing
ab_testing_api_experimentlog  -- user_id, experiment_key, variant, model_version

-- Event Logging
event_logging_impressionlog   -- user_id, ad_id, experiment_key, variant
event_logging_clicklog        -- user_id, ad_id, experiment_key, variant
```

### ClickHouse (OLAP Analytics)

```sql
-- Real-time aggregated metrics (written by Flink)
ad_aggregate        -- ad_id, campaign_id, click_count, window_start, window_end
user_click_rate     -- user_id, click_count, window_start, window_end
```

---

## 🚀 How to Run (Development)

### Prerequisites
- Java 21 + Maven
- Python 3.10+ + pip
- Node.js 18+
- Docker & Docker Compose
- MySQL 8+
- Kafka (local or Docker)
- Redis

### 1. Start Infrastructure (Docker)

```bash
cd ad-click-aggregator
docker-compose up -d    # Starts ClickHouse + Flink cluster
```

### 2. Start Kafka & Redis

```bash
# Start Kafka broker (localhost:9092)
# Start Redis (localhost:6379)
# Create topic: ad-click-topic-1
```

### 3. Run Ad Click Aggregator (Spring Boot)

```bash
cd ad-click-aggregator
./mvnw spring-boot:run    # Starts on port 8086
```

### 4. Run CTR Prediction Service (Django)

```bash
cd ctr_prediction_service
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver    # Starts on port 8000
```

### 5. Run Frontend Dashboard (React)

```bash
cd ad-management-studio
npm install
npm run dev    # Starts on port 5173
```

---

## 📂 Project Structure

```
ad-management-studio/               # Root monorepo
├── ad-click-aggregator/            # Java — Kafka + Flink + ClickHouse pipeline
├── ad_processor/                   # Java — Ad serving + Click processor (Spring Boot)
├── ctr_prediction_service/         # Python — CTR prediction + A/B testing + Event logging
├── ad-management-studio/           # JavaScript — React frontend dashboard
├── README.md                       # This file
└── .gitignore
```

---

## 📈 Why This Architecture?

| Concern | Solution |
|---------|----------|
| **Low-latency user redirects** | HTTP 302 returned before async processing |
| **Exactly-once click counting** | Redis impression ID cache + Kafka dedup |
| **Real-time analytics** | Flink windowed aggregation → ClickHouse |
| **ML-powered ad ranking** | scikit-learn model with 12-feature contextual scoring |
| **Experiment integrity** | Deterministic MD5-based A/B assignment |
| **Data accuracy** | Spark batch reconciliation between raw and aggregated data |
| **Horizontal scalability** | Kafka partitioning, stateless APIs, Flink parallelism |
| **Fault tolerance** | Kafka durability, Flink checkpointing, non-blocking writes |
| **Observability** | Model monitoring (performance + drift), per-prediction latency tracking |

---

## 📝 License

This project is for learning and demonstration purposes.

---

*Built with ❤️ as a full-stack ad-tech platform demonstrating distributed systems, real-time streaming, and machine learning at scale.*