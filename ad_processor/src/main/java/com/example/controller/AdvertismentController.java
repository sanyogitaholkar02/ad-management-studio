package com.example.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.entity.AdSubscriber;
import com.example.entity.Ads;
import com.example.pojo.Advertisments;
import com.example.repo.AdSubscriberRepo;
import com.example.service.AdvertismentPopulateService;
import com.example.service.S3Service;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/ads")
public class AdvertismentController {

    private static final Logger log = LoggerFactory.getLogger(AdvertismentController.class);

    @Autowired
    private AdvertismentPopulateService service;

    @Autowired
    private S3Service serv;

    @Autowired
    private AdSubscriberRepo adSubscriberRepo;

    @PostMapping("/add-list")
    public ResponseEntity<List<Ads>> addAdvertisment(
            @Valid @RequestBody List<@Valid Advertisments> advertismentsList) {
        log.info("POST /ads/add-list — adding {} advertisements", advertismentsList.size());
        List<Ads> savedAds = service.addAdsList(advertismentsList);
        return ResponseEntity.ok(savedAds);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Advertisments>> getAll() {
        log.info("GET /ads/all — fetching all advertisements");
        List<Advertisments> ads = service.getAllAds();
        return ResponseEntity.ok(ads);
    }

    @PostMapping("/upload-image")
    public ResponseEntity<String> uploadAdImage(@RequestParam("file") MultipartFile file,
            @RequestParam("adId") String adId) throws Exception {

        log.info("POST /ads/upload-image — uploading image for adId={}", adId);

        if (adId == null || adId.isBlank()) {
            throw new IllegalArgumentException("adId is required for image upload");
        }

        String key = "ads/" + adId + "-" + file.getOriginalFilename();
        String url = serv.uploadFile(file, key);
        return ResponseEntity.ok(url);
    }

    @PostMapping("/add")
    public ResponseEntity<Ads> addAd(@RequestParam("file") MultipartFile file,
            @RequestParam("adId") String adId,
            @RequestParam("campaignId") String campaignId,
            @RequestParam("company") String company,
            @RequestParam("redirectUrl") String redirectUrl) throws Exception {

        log.info("POST /ads/add — adding ad with adId={}, company={}", adId, company);

        if (adId == null || adId.isBlank()) {
            throw new IllegalArgumentException("adId is required");
        }
        if (campaignId == null || campaignId.isBlank()) {
            throw new IllegalArgumentException("campaignId is required");
        }
        if (company == null || company.isBlank()) {
            throw new IllegalArgumentException("company is required");
        }
        if (redirectUrl == null || redirectUrl.isBlank()) {
            throw new IllegalArgumentException("redirectUrl is required");
        }

        String key = "ads/" + adId + "-" + file.getOriginalFilename();
        String imageUrl = serv.uploadFile(file, key);

        Ads ad = new Ads(adId, redirectUrl, campaignId, company);
        // TODO: Save ad to DB — repo.save(ad) once image URL field is mapped

        log.info("Ad created with adId={}, imageUrl={}", adId, imageUrl);
        return ResponseEntity.ok(ad);
    }

    /**
     * GET /ads/users?adId=AD-1004&campaignId=camp004
     * Returns the list of user IDs who clicked on the given ad.
     */
    @GetMapping("/adsSubscribers")
    public ResponseEntity<?> getUsersByAdAndCampaign(
            @RequestParam String adId,
            @RequestParam String campaignId) {

        log.info("GET /ads/adsSubscribers — adId={}, campaignId={}", adId, campaignId);

        // Query from ad_subscriber table
        List<AdSubscriber> subscribers = adSubscriberRepo.findByAdId(adId);

        List<Map<String, Object>> userDetails = subscribers.stream()
                .map(s -> {
                    Map<String, Object> user = new LinkedHashMap<>();
                    user.put("userId", s.getUserId());
                    user.put("clickCount", s.getClickCount());
                    return user;
                })
                .collect(Collectors.toList());

        List<String> userIds = subscribers.stream()
                .map(AdSubscriber::getUserId)
                .distinct()
                .collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("adId", adId);
        response.put("campaignId", campaignId);
        response.put("totalUsers", userIds.size());
        response.put("userIds", userIds);
        response.put("userDetails", userDetails);

        return ResponseEntity.ok(response);
    }
}
