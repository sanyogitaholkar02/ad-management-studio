package com.example.exception;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {

        private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex,
                        WebRequest request) {

                List<String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                                .map(error -> error.getField() + " : " + error.getDefaultMessage()).toList();

                String message = String.join("; ", fieldErrors);
                ErrorResponse error = new ErrorResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                "Validation Failed",
                                message,
                                request.getDescription(false).replace("uri=", ""));

                log.warn("Validation failed: {}", message);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ErrorResponse> handleMalformedJson(HttpMessageNotReadableException ex,
                        WebRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                "Malformed JSON",
                                "Request body is missing or contains invalid JSON",
                                request.getDescription(false).replace("uri=", ""));

                log.warn("Malformed JSON request: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        @ExceptionHandler(MissingServletRequestParameterException.class)
        public ResponseEntity<ErrorResponse> handleMissingParams(MissingServletRequestParameterException ex,
                        WebRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                "Missing Parameter",
                                "Required parameter '" + ex.getParameterName() + "' of type " + ex.getParameterType()
                                                + " is missing",
                                request.getDescription(false).replace("uri=", ""));

                log.warn("Missing request parameter: {}", ex.getParameterName());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        // ─── Ad Not Found (404) ────────────────────────────────────────────

        @ExceptionHandler(AdNotFoundException.class)
        public ResponseEntity<ErrorResponse> handleAdNotFound(AdNotFoundException ex, WebRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.NOT_FOUND.value(),
                                "Ad Not Found",
                                ex.getMessage(),
                                request.getDescription(false).replace("uri=", ""));

                log.warn("Ad not found: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        // ─── Duplicate Click (302 redirect) ────────────────────────────────

        @ExceptionHandler(DuplicateClickException.class)
        public ResponseEntity<Void> handleDuplicateClick(DuplicateClickException ex) {

                log.info("Duplicate click detected: {}", ex.getMessage());

                HttpHeaders headers = new HttpHeaders();
                headers.add("Location", ex.getRedirectUrl());
                headers.add("X-Duplicate", "true");
                return ResponseEntity.status(HttpStatus.FOUND).headers(headers).build();
        }

        // ─── S3 Upload Failure (502) ───────────────────────────────────────

        @ExceptionHandler(S3UploadException.class)
        public ResponseEntity<ErrorResponse> handleS3UploadFailure(S3UploadException ex, WebRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.BAD_GATEWAY.value(),
                                "S3 Upload Failed",
                                ex.getMessage(),
                                request.getDescription(false).replace("uri=", ""));

                log.error("S3 upload failed: {}", ex.getMessage(), ex);
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error);
        }

        // ─── Kafka Publish Failure (502) ───────────────────────────────────

        @ExceptionHandler(KafkaPublishException.class)
        public ResponseEntity<ErrorResponse> handleKafkaFailure(KafkaPublishException ex, WebRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.BAD_GATEWAY.value(),
                                "Kafka Publish Failed",
                                ex.getMessage(),
                                request.getDescription(false).replace("uri=", ""));

                log.error("Kafka publish failed: {}", ex.getMessage(), ex);
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error);
        }

        // ─── Redis Connection Failure (503) ────────────────────────────────

        @ExceptionHandler(RedisConnectionFailureException.class)
        public ResponseEntity<ErrorResponse> handleRedisFailure(RedisConnectionFailureException ex,
                        WebRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.SERVICE_UNAVAILABLE.value(),
                                "Redis Unavailable",
                                "Redis connection failed. Deduplication service is temporarily unavailable.",
                                request.getDescription(false).replace("uri=", ""));

                log.error("Redis connection failure: {}", ex.getMessage(), ex);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
        }

        // ─── File Upload Size Exceeded (413) ───────────────────────────────

        @ExceptionHandler(MaxUploadSizeExceededException.class)
        public ResponseEntity<ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex,
                        WebRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.PAYLOAD_TOO_LARGE.value(),
                                "File Too Large",
                                "Uploaded file exceeds the maximum allowed size",
                                request.getDescription(false).replace("uri=", ""));

                log.warn("File upload size exceeded: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(error);
        }

        // ─── IllegalArgumentException (400) ────────────────────────────────

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                "Invalid Argument",
                                ex.getMessage(),
                                request.getDescription(false).replace("uri=", ""));

                log.warn("Illegal argument: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        // ─── Catch-All Fallback (500) ──────────────────────────────────────

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, WebRequest request) {

                ErrorResponse error = new ErrorResponse(
                                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                "Internal Server Error",
                                "An unexpected error occurred. Please try again later.",
                                request.getDescription(false).replace("uri=", ""));

                log.error("Unhandled exception: ", ex);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
}
