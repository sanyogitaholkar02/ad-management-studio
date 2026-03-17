package com.example.ad_processor.service;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.ad_processor.entity.Ads;
import com.example.ad_processor.pojo.Advertisments;
import com.example.ad_processor.repo.AdvertismentRepo;

@Service
public class AdvertismentPopulateService {

    private static final Logger log = LoggerFactory.getLogger(AdvertismentPopulateService.class);

    @Autowired
    AdvertismentRepo repo;

    public List<Advertisments> getListAdsForUser(String userid) {
        if (userid == null || userid.isBlank()) {
            throw new IllegalArgumentException("userId is required to fetch ads");
        }
        return List.of(new Advertisments("1", "https://google.com", "Google", "https://google.com/image", "Google Ad",
                "Technology", "Technology", "Google", userid));
    }

    public Advertisments getAdsForUser(String userid) {
        if (userid == null || userid.isBlank()) {
            throw new IllegalArgumentException("userId is required to fetch ads");
        }
        return new Advertisments("1", "https://google.com", "Google", "https://google.com/image", "Google Ad",
                "Technology", "Technology", "Google", userid);
    }

    public List<Advertisments> getAllAds() {
        List<Ads> ads = repo.findAll();

        if (ads.isEmpty()) {
            log.info("No advertisements found in the database");
            return List.of();
        }

        List<Advertisments> listAds = new ArrayList<>();
        for (Ads ad : ads) {
            Advertisments advertisments = new Advertisments(ad.getAdID(), ad.getRedirectURL(), ad.getCampaignId(),
                    ad.getCompany(), null, null, null, null, null);
            listAds.add(advertisments);
        }

        log.info("Fetched {} advertisements from the database", listAds.size());
        return listAds;
    }

    @Transactional
    public List<Ads> addAdsList(List<Advertisments> advertismentsList) {
        if (advertismentsList == null || advertismentsList.isEmpty()) {
            throw new IllegalArgumentException("Advertisement list cannot be null or empty");
        }

        List<Ads> adsList = new ArrayList<>();
        for (Advertisments a : advertismentsList) {
            adsList.add(new Ads(a.getAdID(), a.getRedirectURL(), a.getCampaignId(), a.getCompany(), a.getImageURL(),
                    a.getDescription(), a.getCategory(), a.getTargetAudience(), a.getHostingPlatform()));
        }

        List<Ads> savedAds = repo.saveAll(adsList);
        log.info("Saved {} advertisements to the database", savedAds.size());
        return savedAds;
    }
}
