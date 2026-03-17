package com.example.exception;

public class S3UploadException extends RuntimeException {

    public S3UploadException(String key, Throwable cause) {
        super("Failed to upload file to S3 with key: " + key, cause);
    }
}
