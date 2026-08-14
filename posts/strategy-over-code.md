---
title: Strategy Over Code: Redesigning API Caching Architecture
date: '2019-11-10 18:26:24'
updated: '2019-11-17 22:43:27'
tags: ['java', 'cache-strategy', 'architecture']
slug: strategy-over-code
readTime: 8 min read
cover: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1000&auto=format&fit=crop
summary: Lessons learned from optimizing offline-to-online data ingestion pipelines, handling volatile log API SLAs, and designing sliding window caches using Guava.
---

## 1. System Background
I lead the pipeline infrastructure responsible for syncing offline analytical data into live production storage. Customer teams write offline computed features into Hive tables. Our data ingestion engine extracts data from Hive, publishes messages to Apache Kafka, and online microservices consume Kafka queues to write live records into Aerospike.

### Pipeline Architecture:
`Hive Table` -> `Ingestion Engine` -> `Kafka Queue` -> `Online Consumer` -> `Aerospike Storage`

Because data undergoes multi-stage transformations, schema validation errors or network blips can drop records. Measuring and monitoring node-by-node conversion efficiency is critical.

To monitor pipeline health, we built a metrics aggregation service that logs stage conversion rates into centralized log infrastructure (Sherlock). Our Web UI reads these metrics through upstream APIs and renders job execution histories.

However, the legacy implementation suffered from unstable API responses, missing historical records, and severe SLA bottlenecks.

---

## 2. Root Cause Analysis

### 2.1 Technical Constraints of Upstream Log APIs
The upstream log search endpoint had the following characteristics:
1. **High Error Rate**: ~60% of API calls failed with HTTP 500 server errors under load.
2. **High Latency**: Average response time reached ~1000ms, exceeding our UI target (<50ms).
3. **Query Range Limit**: Upstream APIs capped searches at 7 days. Product requirements demanded a 30-day execution history.

### 2.2 Core Issue: Naive Cache Refresh Strategy
The original cache implementation wiped and replaced the entire cached list during every sync cycle. If upstream APIs returned intermittent failures, random jobs vanished from the UI cache, confusing monitoring users.

---

## 3. Sliding Window Cache Strategy

### 3.1 Design Principles
1. **30-Day Window Partitioning**: Partition historical jobs into 30 daily discrete time windows.
2. **Immutable Day Caching**: Once a historical day's job batch completes successfully, freeze its cache window. Historical days do not require re-fetching.
3. **Idempotent Job Completion Marker**: When a job's metric counter remains unchanged across consecutive 5-minute sync intervals, mark it `FINISHED`. Finished jobs bypass future polling.
4. **Guava EvictingQueue**: Use `EvictingQueue` to maintain fixed-size 30-day windows, automatically dropping expired historical days as new days arrive.

```
       [ 30-Day Sliding Window Cache ]
 ---------------------------------------------
 | Day -30 | Day -29 | ... | Day -1 | Today  |
 ---------------------------------------------
     |                                  |
 [Frozen/Immutable]              [Active Refresh]
```

### 3.2 Cold Start Initialization Strategy
To prevent initialization request storms upon service restart:
1. Divide time windows into daily partitions upon startup.
2. At T+2 mins, start a scheduled background thread refreshing active (un-stabilized) jobs every 60 seconds.
3. At T+2 mins, execute a 5-minute background batch task loading historical window partitions from Day -30 forward.

---

## 4. Edge Cases & Resilience

### 4.1 Missing Metric Data Handling
**Issue**: Null payloads caused perpetual retry loops.
**Fix**: Return empty fallback objects rather than `null`. Two consecutive empty snapshots signify completion, marking the job `FINISHED`.

### 4.2 Multi-Day Long-Running Jobs
**Issue**: Multi-day jobs shifted early day windows into unstable states.
**Fix**: Preemption registration. Jobs register into the earliest detected window. Active updates claim job ownership, keeping window schedules deterministic.
