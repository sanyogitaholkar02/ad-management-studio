package com.example.ad_processor.exception;

public class DuplicateClickException extends RuntimeException {

    private final String redirectUrl;

    public DuplicateClickException(String idempotencyKey, String redirectUrl) {
        super("Duplicate click detected for idempotencyKey: " + idempotencyKey);
        this.redirectUrl = redirectUrl;
    }

    public String getRedirectUrl() {
        return redirectUrl;
    }
}
