package com.example.pojo;

public class Advertisments {

    private String adID;
    private String redirectURL;
    private String campaignId;
    private String company;
    private String imageURL;
    private String description;
    private String category;
    private String targetAudience;
    private String hostingPlatform;

    public Advertisments(String adID, String redirectURL, String campaignId, String company, String imageURL,
            String description,
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

    public String getAdID() {
        return adID;
    }

    public void setAdID(String adID) {
        this.adID = adID;
    }

    public String getRedirectURL() {
        return redirectURL;
    }

    public void setRedirectURL(String redirectURL) {
        this.redirectURL = redirectURL;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getImageURL() {
        return imageURL;
    }

    public void setImageURL(String imageURL) {
        this.imageURL = imageURL;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTargetAudience() {
        return targetAudience;
    }

    public void setTargetAudience(String targetAudience) {
        this.targetAudience = targetAudience;
    }

    public String getHostingPlatform() {
        return hostingPlatform;
    }

    public void setHostingPlatform(String hostingPlatform) {
        this.hostingPlatform = hostingPlatform;
    }

    public String getCampaignId() {
        return campaignId;
    }

    public void setCampaignId(String campaignId) {
        this.campaignId = campaignId;
    }

}
