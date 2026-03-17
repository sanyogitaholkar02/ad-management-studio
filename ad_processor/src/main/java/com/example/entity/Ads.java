package com.example.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "advertisments")
public class Ads {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "adID is required")
    private String adID;

    @NotBlank(message = "redirectURL is required")
    private String redirectURL;

    @NotBlank(message = "campaignId is required")
    private String campaignId;

    @NotBlank(message = "company is required")
    private String company;

    private String imageURL;
    private String description;
    private String category;
    private String targetAudience;
    private String hostingPlatform;

    public Ads(@NotBlank(message = "adID is required") String adID,
            @NotBlank(message = "redirectURL is required") String redirectURL,
            @NotBlank(message = "campaignId is required") String campaignId,
            @NotBlank(message = "company is required") String company) {

        this.adID = adID;
        this.redirectURL = redirectURL;
        this.campaignId = campaignId;
        this.company = company;
    }

    public Ads(@NotBlank(message = "adID is required") String adID,
            @NotBlank(message = "redirectURL is required") String redirectURL,
            @NotBlank(message = "campaignId is required") String campaignId,
            @NotBlank(message = "company is required") String company, String imageURL, String description,
            String category, String targetAudience, String hostingPlatform) {

        this.adID = adID;
        this.redirectURL = redirectURL;
        this.campaignId = campaignId;
        this.company = company;
        this.imageURL = imageURL;
        this.description = description;
        this.category = category;
        this.targetAudience = targetAudience;
        this.hostingPlatform = hostingPlatform;
    }

    public Ads() {

    }

}
