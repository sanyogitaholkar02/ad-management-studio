package com.example.ad_processor.service;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.ad_processor.exception.S3UploadException;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

@Service
public class S3Service {

    private static final Logger log = LoggerFactory.getLogger(S3Service.class);

    private final S3Client s3Client;
    private final String bucketName = "your-bucket-name";

    public S3Service(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public String uploadFile(MultipartFile file, String key) throws IOException {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }

        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("S3 key cannot be null or blank");
        }

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            PutObjectResponse response = s3Client.putObject(putObjectRequest,
                    software.amazon.awssdk.core.sync.RequestBody.fromBytes(file.getBytes()));

            String url = "https://" + bucketName + ".s3.amazonaws.com/" + key;
            log.info("Successfully uploaded file to S3: {}", url);
            return url;

        } catch (IOException ex) {
            log.error("Failed to read file bytes for S3 upload: key={}", key, ex);
            throw ex;
        } catch (Exception ex) {
            log.error("S3 upload failed for key={}", key, ex);
            throw new S3UploadException(key, ex);
        }
    }
}
