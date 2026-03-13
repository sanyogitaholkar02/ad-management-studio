package com.example.ad_click_aggregator.entity;

import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "ads-agg")
public class AdAggregateEntity {

    @Id
    private Long id;

    @Column(name = "window_start")
    private Instant windowStart;

    private String adId;
    private String campaignId;
    private Long clicks;
    private Double revenue;

    public AdAggregateEntity() {
    }

    @PrePersist
    public void generateId() {
        if (this.id == null) {
            this.id = System.nanoTime() + ThreadLocalRandom.current().nextLong(1000);
        }
    }

}
