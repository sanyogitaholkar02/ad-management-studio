package com.example.ad_processor.controller;

import java.util.List;

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

import com.example.ad_processor.entity.Ads;
import com.example.ad_processor.pojo.Advertisments;
import com.example.ad_processor.service.AdvertismentPopulateService;
import com.example.ad_processor.service.S3Service;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/ads")
public class AdvertismentController {

    private static final Logger log = LoggerFactory.getLogger(AdvertismentController.class);

    @Autowired
    private AdvertismentPopulateService service;

    @Autowired
    private S3Service serv;

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

    @GetMapping("/start")
    public String checkApplicationStart() {
        return "Yes!! Application ad-click-processor is running";
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
}
