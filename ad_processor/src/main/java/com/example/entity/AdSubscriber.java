package com.example.entity;

import java.sql.Timestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "ad_subscriber")
public class AdSubscriber {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String adId;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private int clickCount;

    @Column(nullable = false)
    private Timestamp timestamp;

    @Column(name = "interest_id")
    private String interestId;

    // Foreign key to advertisments table
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ad_ref_id", referencedColumnName = "id")
    private Ads ad;

    public AdSubscriber() {
    }

    public AdSubscriber(String adId, String userId, Timestamp timestamp, Ads ad) {
        this.adId = adId;
        this.userId = userId;
        this.clickCount = 1;
        this.timestamp = timestamp;
        this.ad = ad;
    }
}
