package com.example.ad_processor.exception;

public class AdNotFoundException extends RuntimeException {

    public AdNotFoundException(String adId) {
        super("Advertisement not found with adID: " + adId);
    }
}
