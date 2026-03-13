package com.example.ad_click_aggregator.controller;

import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/flink")
public class FlinkController {

    @GetMapping("/submit-job-test")
    public String submitJob() {
        try {
            // 1️⃣ Flink execution environment
            StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

            // 2️⃣ Minimal data stream
            DataStream<String> stream = env.fromElements("Alice", "Bob", "Charlie");

            // 3️⃣ Simple transformation: uppercase and print
            stream
                    .map(String::toUpperCase)
                    .print();

            // 4️⃣ Execute the job with explicit job name
            String jobName = "TestJob_AliceBobCharlie"; // <-- explicit job name
            env.execute(jobName);

            return "Flink job '" + jobName + "' submitted successfully!";
        } catch (Exception e) {
            e.printStackTrace();
            return "Flink job submission failed: " + e.getMessage();
        }

    }

}
