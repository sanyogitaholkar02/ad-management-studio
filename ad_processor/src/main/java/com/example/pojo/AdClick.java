package com.example.pojo;

import java.sql.Timestamp;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AdClick {

    // No-arg constructor required by Jackson for deserialization
    public AdClick() {
    }

    @JsonProperty("adId")
    private String adId;

    @JsonProperty("idempotencyKey")
    private String idempotencyKey;

    @JsonProperty("timestamp")
    private Timestamp timestamp;

    public String getAdId() {
        return adId;
    }

    public void setAdId(String adId) {
        this.adId = adId;
    }

    @Override
    public String toString() {
        return "AdClick{" +
                "adId='" + adId + '\'' +
                ", idempotencyKey='" + idempotencyKey + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public Timestamp getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Timestamp timestamp) {
        this.timestamp = timestamp;
    }

}
