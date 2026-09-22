package com.bhoomidrishti;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the BHOOMI-DRISHTI backend.
 *
 * <p>Phase 1 provides the application skeleton and the health endpoint only.
 * Domain modules (land records, research hub, AI assistant, ...) are added in later phases.
 */
@SpringBootApplication
public class BhoomiDrishtiApplication {

    public static void main(String[] args) {
        SpringApplication.run(BhoomiDrishtiApplication.class, args);
    }
}
