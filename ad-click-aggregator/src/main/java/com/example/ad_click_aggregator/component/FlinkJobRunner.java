package com.example.ad_click_aggregator.component;

import jakarta.annotation.PostConstruct;

import java.io.File;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Submits the Flink job JAR to the Docker Flink cluster via REST API.
 * The job then runs on the remote Flink cluster and appears in the Flink UI.
 */
@Component
public class FlinkJobRunner {

    @Value("${flink.rest.url:http://localhost:8087}")
    private String flinkRestUrl;

    @Value("${flink.job.jar-path:target/flink-job.jar}")
    private String jarPath;

    @Value("${kafka.bootstrap.servers}")
    private String bootstrapServers;

    @Value("${kafka.topic}")
    private String topic;

    @Value("${kafka.group.id}")
    private String groupId;

    @Value("${flink.clickhouse.url}")
    private String clickhouseUrl;

    @Value("${flink.clickhouse.user}")
    private String clickhouseUser;

    @Value("${flink.clickhouse.password}")
    private String clickhousePassword;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void startFlinkJob() {
        Thread flinkThread = new Thread(() -> {
            try {
                // Small delay to let Spring Boot fully start
                Thread.sleep(3000);
                System.out.println("=== Submitting Flink job to " + flinkRestUrl + " ===");
                submitJob();
            } catch (Exception e) {
                System.err.println("=== Flink job submission FAILED ===");
                e.printStackTrace();
            }
        }, "flink-job-submitter");
        flinkThread.setDaemon(true);
        flinkThread.start();
    }

    private void submitJob() throws Exception {
        File jarFile = new File(jarPath);
        if (!jarFile.exists()) {
            System.err.println("[Flink] JAR not found: " + jarFile.getAbsolutePath());
            System.err.println("[Flink] Build it first: mvn package -DskipTests");
            return;
        }

        // Step 1: Upload JAR to Flink cluster
        System.out.println("[Flink] Uploading JAR: " + jarFile.getAbsolutePath());
        String jarId = uploadJar(jarFile);
        System.out.println("[Flink] JAR uploaded: " + jarId);

        // Step 2: Run the job
        String programArgs = String.join(" ",
                "--kafka.bootstrap.servers", bootstrapServers,
                "--kafka.topic", topic,
                "--kafka.group.id", groupId,
                "--clickhouse.url", clickhouseUrl,
                "--clickhouse.user", clickhouseUser,
                "--clickhouse.password", clickhousePassword);

        System.out.println("[Flink] Starting job with args: " + programArgs);
        String jobId = runJar(jarId, programArgs);
        System.out.println("=== Flink job submitted! JobID: " + jobId + " ===");
        System.out.println("=== View at: " + flinkRestUrl + "/#/job/" + jobId + " ===");
    }

    private String uploadJar(File jarFile) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("jarfile", new FileSystemResource(jarFile));

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                flinkRestUrl + "/jars/upload", request, String.class);

        JsonNode json = objectMapper.readTree(response.getBody());
        // Response: {"filename":"/tmp/flink-web-.../flink-job.jar","status":"success"}
        String filename = json.get("filename").asText();
        // Extract jar ID (last part of the path)
        return filename.substring(filename.lastIndexOf("/") + 1);
    }

    private String runJar(String jarId, String programArgs) throws Exception {
        String url = flinkRestUrl + "/jars/" + jarId + "/run";

        String requestBody = objectMapper.writeValueAsString(
                java.util.Map.of(
                        "entryClass", "com.example.ad_click_aggregator.FlinkJobMain",
                        "programArgs", programArgs));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        JsonNode json = objectMapper.readTree(response.getBody());
        return json.get("jobid").asText();
    }
}
