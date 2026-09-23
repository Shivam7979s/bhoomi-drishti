package com.bhoomidrishti.knowledge.client;

import com.bhoomidrishti.exception.AiServiceUnavailableException;
import com.bhoomidrishti.knowledge.dto.DocumentProcessingStatusResponse;
import com.bhoomidrishti.knowledge.dto.IngestDocumentResponse;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchRequest;
import com.bhoomidrishti.knowledge.dto.KnowledgeSearchResponse;
import com.bhoomidrishti.knowledge.entity.ProcessingStatus;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);

    private final RestClient restClient;

    public AiServiceClient(
            @Value("${app.ai-service.url:http://localhost:8000}") String baseUrl,
            @Value("${app.ai-service.secret:dev_ai_internal_secret_bhoomi_drishti}") String internalSecret,
            @Value("${app.ai-service.connect-timeout-ms:3000}") int connectTimeoutMs,
            @Value("${app.ai-service.read-timeout-ms:30000}") int readTimeoutMs) {

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .defaultHeader("X-Internal-Secret", internalSecret)
                .build();
    }

    public IngestDocumentResponse triggerIngest(UUID documentId, String fileUrl, String sourceUrl, String localPath) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("document_id", documentId.toString());
            if (fileUrl != null && !fileUrl.isBlank()) body.put("file_url", fileUrl);
            if (sourceUrl != null && !sourceUrl.isBlank()) body.put("source_url", sourceUrl);
            if (localPath != null && !localPath.isBlank()) body.put("local_path", localPath);

            Map<?, ?> response = restClient.post()
                    .uri("/internal/ingest")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String statusStr = response != null && response.get("status") != null
                    ? response.get("status").toString()
                    : "QUEUED";

            ProcessingStatus status;
            try {
                status = ProcessingStatus.valueOf(statusStr);
            } catch (Exception e) {
                status = ProcessingStatus.QUEUED;
            }

            return new IngestDocumentResponse(
                    documentId,
                    status,
                    response != null && response.get("message") != null
                            ? response.get("message").toString()
                            : "Document ingestion queued."
            );
        } catch (Exception ex) {
            log.error("Failed to call AI service /internal/ingest for document {}: {}", documentId, ex.getMessage());
            throw new AiServiceUnavailableException("AI Knowledge Service is currently unavailable.", ex);
        }
    }

    public KnowledgeSearchResponse search(
            KnowledgeSearchRequest request,
            boolean onlyPublished,
            List<UUID> allowedDocIds) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("query", request.query());
            body.put("top_k", request.resolvedTopK());
            body.put("only_published", onlyPublished);
            if (allowedDocIds != null && !allowedDocIds.isEmpty()) {
                body.put("allowed_document_ids", allowedDocIds.stream().map(UUID::toString).toList());
            }
            if (request.documentType() != null) {
                body.put("document_type", request.documentType().name());
            }
            if (request.organization() != null && !request.organization().isBlank()) {
                body.put("organization", request.organization().trim());
            }

            Map<?, ?> response = restClient.post()
                    .uri("/internal/search")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                return new KnowledgeSearchResponse(request.query(), 0, 0, List.of());
            }

            int totalResults = response.get("total_results") != null
                    ? ((Number) response.get("total_results")).intValue()
                    : 0;
            int durationMs = response.get("search_duration_ms") != null
                    ? ((Number) response.get("search_duration_ms")).intValue()
                    : 0;

            List<?> rawResults = (List<?>) response.get("results");
            List<com.bhoomidrishti.knowledge.dto.EvidenceItemResponse> items = new java.util.ArrayList<>();

            if (rawResults != null) {
                for (Object raw : rawResults) {
                    if (raw instanceof Map<?, ?> itemMap) {
                        UUID chunkId = itemMap.get("chunk_id") != null ? UUID.fromString(itemMap.get("chunk_id").toString()) : null;
                        UUID documentId = itemMap.get("document_id") != null ? UUID.fromString(itemMap.get("document_id").toString()) : null;
                        String docTitle = itemMap.get("document_title") != null ? itemMap.get("document_title").toString() : "";
                        String docType = itemMap.get("document_type") != null ? itemMap.get("document_type").toString() : "";
                        String authors = itemMap.get("authors") != null ? itemMap.get("authors").toString() : null;
                        String org = itemMap.get("organization") != null ? itemMap.get("organization").toString() : null;
                        String pubDateStr = itemMap.get("publication_date") != null ? itemMap.get("publication_date").toString() : null;
                        java.time.LocalDate pubDate = pubDateStr != null ? java.time.LocalDate.parse(pubDateStr) : null;
                        String text = itemMap.get("text") != null ? itemMap.get("text").toString() : "";
                        Integer pageNum = itemMap.get("page_number") != null ? ((Number) itemMap.get("page_number")).intValue() : null;
                        String secTitle = itemMap.get("section_title") != null ? itemMap.get("section_title").toString() : null;
                        double similarity = itemMap.get("similarity") != null ? ((Number) itemMap.get("similarity")).doubleValue() : 0.0;
                        String sourceUrl = itemMap.get("source_url") != null ? itemMap.get("source_url").toString() : null;
                        String citation = itemMap.get("citation") != null ? itemMap.get("citation").toString() : "";
                        int linkedCount = itemMap.get("linked_land_records_count") != null ? ((Number) itemMap.get("linked_land_records_count")).intValue() : 0;

                        items.add(new com.bhoomidrishti.knowledge.dto.EvidenceItemResponse(
                                chunkId, documentId, docTitle, docType, authors, org, pubDate,
                                text, pageNum, secTitle, similarity, sourceUrl, citation, linkedCount
                        ));
                    }
                }
            }

            return new KnowledgeSearchResponse(request.query(), totalResults, durationMs, items);
        } catch (Exception ex) {
            log.error("Failed to call AI service /internal/search: {}", ex.getMessage());
            throw new AiServiceUnavailableException("AI Knowledge Service is currently unavailable.", ex);
        }
    }

    public DocumentProcessingStatusResponse getStatus(UUID documentId) {
        try {
            Map<?, ?> map = restClient.get()
                    .uri("/internal/status/{id}", documentId)
                    .retrieve()
                    .body(Map.class);
            if (map == null) {
                return DocumentProcessingStatusResponse.notIngested(documentId);
            }
            UUID id = map.get("id") != null ? UUID.fromString(map.get("id").toString()) : null;
            UUID docId = map.get("research_document_id") != null
                    ? UUID.fromString(map.get("research_document_id").toString())
                    : documentId;
            String statusStr = map.get("status") != null ? map.get("status").toString() : "NOT_INGESTED";
            ProcessingStatus status;
            try {
                status = ProcessingStatus.valueOf(statusStr);
            } catch (Exception e) {
                status = ProcessingStatus.NOT_INGESTED;
            }
            String errMsg = map.get("error_message") != null ? map.get("error_message").toString() : null;
            int chunkCount = map.get("chunk_count") != null ? ((Number) map.get("chunk_count")).intValue() : 0;
            String hash = map.get("content_hash") != null ? map.get("content_hash").toString() : null;
            String version = map.get("processing_version") != null ? map.get("processing_version").toString() : "v1-bge-small";
            return new DocumentProcessingStatusResponse(id, docId, status, errMsg, chunkCount, hash, version, null, null);
        } catch (Exception ex) {
            log.warn("Failed to query AI service /internal/status/{}: {}", documentId, ex.getMessage());
            return DocumentProcessingStatusResponse.notIngested(documentId);
        }
    }
}
