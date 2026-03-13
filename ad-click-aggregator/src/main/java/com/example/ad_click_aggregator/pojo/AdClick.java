package com.example.ad_click_aggregator.pojo;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AdClick {

    @JsonProperty("adId")
    private String adId;
    private String campaignId;

    @JsonProperty("userId")
    private String userId;

    @JsonProperty("idempotencyKey")
    private String idempotencyKey;

    @JsonProperty("timestamp")
    private Instant timestamp;
    private double cost;

    // Default constructor (required by Jackson)
    public AdClick() {
    }

    // Constructor with fields
    public AdClick(String adId, String campaignId, double cost) {
        this.adId = adId;
        this.campaignId = campaignId;
        this.cost = cost;
    }

    // Getters and Setters
    public String getAdId() {
        return adId;
    }

    public void setAdId(String adId) {
        this.adId = adId;
    }

    public String getCampaignId() {
        return campaignId;
    }

    public void setCampaignId(String campaignId) {
        this.campaignId = campaignId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public double getCost() {
        return cost;
    }

    public void setCost(double cost) {
        this.cost = cost;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "AdClick{" +
                "adId='" + adId + '\'' +
                ", campaignId='" + campaignId + '\'' +
                ", userId='" + userId + '\'' +
                ", cost=" + cost +
                '}';
    }
}