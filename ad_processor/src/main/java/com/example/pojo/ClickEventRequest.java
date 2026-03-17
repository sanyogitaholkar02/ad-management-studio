package com.example.pojo;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClickEventRequest {

    private String adId;
    private String campaignId;
    private long timestamp;
    private String redirectUrl;

    @NotBlank(message = "idempotencyKey is required")
    private String idempotencyKey;

    private String userId;

    public ClickEventRequest() {

    }

    public ClickEventRequest(String adId, String campaignId, String userId, String redirectUrl) {
        this.adId = adId;
        this.campaignId = campaignId;
        this.redirectUrl = redirectUrl;
        this.userId = userId;
    }

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

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

}
