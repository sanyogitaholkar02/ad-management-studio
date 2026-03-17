package com.example.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "click_events")
public class ClickEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String adId;
    private String campaignId;
    private long timestamp;
    private String redirectUrl;
    private String userId;

    public ClickEvent(String adId, String campaignId, String userId, String redirectUrl) {

        this.adId = adId;
        this.campaignId = campaignId;
        this.redirectUrl = redirectUrl;
        this.userId = userId;
    }

}
