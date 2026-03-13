package com.example.ad_click_aggregator.entity;

import java.time.Instant;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserClickRateEntity {

    private String userId;
    private Instant windowStart;
    private Instant windowEnd;
    private Long clicks;
    private Double totalCost;

    public UserClickRateEntity() {
    }

    @Override
    public String toString() {
        return "UserClickRate{" +
                "userId='" + userId + '\'' +
                ", clicks=" + clicks +
                ", totalCost=" + totalCost +
                ", window=" + windowStart + " -> " + windowEnd +
                '}';
    }
}
