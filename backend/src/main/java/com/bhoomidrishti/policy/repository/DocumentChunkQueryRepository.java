package com.bhoomidrishti.policy.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Direct JDBC query repository for {@code document_chunks} provenance inspection.
 *
 * <p>Phase 5 vector embeddings and document chunks are managed in PostgreSQL with pgvector.
 * This repository allows Phase 8 policy intelligence to verify chunk provenance, ensure
 * chunk-to-document parent relationships, and retrieve snippet metadata without requiring
 * heavy entity mapping or mutating vector storage.
 */
@Repository
public class DocumentChunkQueryRepository {

    private final JdbcTemplate jdbcTemplate;
    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    public DocumentChunkQueryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedParameterJdbcTemplate = new NamedParameterJdbcTemplate(jdbcTemplate);
    }

    /**
     * Provenance record for a document chunk snippet.
     */
    public record DocumentChunkProvenance(
            UUID id,
            UUID researchDocumentId,
            int chunkIndex,
            String text,
            Integer pageNumber,
            String sectionTitle
    ) {}

    private static final RowMapper<DocumentChunkProvenance> PROVENANCE_MAPPER = (ResultSet rs, int rowNum) ->
            new DocumentChunkProvenance(
                    rs.getObject("id", UUID.class),
                    rs.getObject("research_document_id", UUID.class),
                    rs.getInt("chunk_index"),
                    rs.getString("text"),
                    rs.getObject("page_number") != null ? rs.getInt("page_number") : null,
                    rs.getString("section_title")
            );

    /**
     * Checks if a document chunk exists.
     */
    public boolean existsById(UUID chunkId) {
        if (chunkId == null) {
            return false;
        }
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM document_chunks WHERE id = ?",
                Integer.class,
                chunkId
        );
        return count != null && count > 0;
    }

    /**
     * Verifies that the chunk exists and belongs to the given research document.
     */
    public boolean existsByIdAndResearchDocumentId(UUID chunkId, UUID researchDocumentId) {
        if (chunkId == null || researchDocumentId == null) {
            return false;
        }
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM document_chunks WHERE id = ? AND research_document_id = ?",
                Integer.class,
                chunkId,
                researchDocumentId
        );
        return count != null && count > 0;
    }

    /**
     * Finds chunk provenance by chunk ID.
     */
    public Optional<DocumentChunkProvenance> findProvenanceById(UUID chunkId) {
        if (chunkId == null) {
            return Optional.empty();
        }
        List<DocumentChunkProvenance> results = jdbcTemplate.query(
                "SELECT id, research_document_id, chunk_index, text, page_number, section_title " +
                "FROM document_chunks WHERE id = ?",
                PROVENANCE_MAPPER,
                chunkId
        );
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    /**
     * Batch retrieves chunk provenance for multiple chunk IDs.
     */
    public Map<UUID, DocumentChunkProvenance> findProvenanceByIds(Collection<UUID> chunkIds) {
        if (chunkIds == null || chunkIds.isEmpty()) {
            return Collections.emptyMap();
        }
        MapSqlParameterSource params = new MapSqlParameterSource("chunkIds", chunkIds);
        List<DocumentChunkProvenance> results = namedParameterJdbcTemplate.query(
                "SELECT id, research_document_id, chunk_index, text, page_number, section_title " +
                "FROM document_chunks WHERE id IN (:chunkIds)",
                params,
                PROVENANCE_MAPPER
        );

        Map<UUID, DocumentChunkProvenance> map = new HashMap<>();
        for (DocumentChunkProvenance p : results) {
            map.put(p.id(), p);
        }
        return map;
    }
}
