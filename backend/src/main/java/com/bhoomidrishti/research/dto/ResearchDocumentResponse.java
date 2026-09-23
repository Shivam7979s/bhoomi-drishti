package com.bhoomidrishti.research.dto;

import com.bhoomidrishti.landrecord.entity.LandRecord;
import com.bhoomidrishti.research.entity.DocumentType;
import com.bhoomidrishti.research.entity.ResearchDocument;
import com.bhoomidrishti.research.entity.ResearchDocumentStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public record ResearchDocumentResponse(
        UUID id,
        String title,
        String description,
        DocumentType documentType,
        String authors,
        String organization,
        LocalDate publicationDate,
        String sourceUrl,
        String fileUrl,
        String language,
        String keywords,
        String abstractText,
        ResearchDocumentStatus status,
        UUID createdById,
        String createdByName,
        Instant createdAt,
        Instant updatedAt,
        int linkedLandRecordCount,
        List<LinkedLandRecordSummary> linkedLandRecords
) {

    public record LinkedLandRecordSummary(
            UUID id,
            String parcelNumber,
            String state,
            String district,
            String tehsil,
            String village,
            String landUseType,
            String status
    ) {
        public static LinkedLandRecordSummary from(LandRecord lr) {
            return new LinkedLandRecordSummary(
                    lr.getId(),
                    lr.getParcelNumber(),
                    lr.getState(),
                    lr.getDistrict(),
                    lr.getTehsil(),
                    lr.getVillage(),
                    lr.getLandUseType() != null ? lr.getLandUseType().name() : null,
                    lr.getStatus() != null ? lr.getStatus().name() : null
            );
        }
    }

    public static ResearchDocumentResponse from(ResearchDocument doc) {
        UUID creatorId = doc.getCreatedBy() != null ? doc.getCreatedBy().getId() : null;
        String creatorName = doc.getCreatedBy() != null ? doc.getCreatedBy().getName() : null;

        List<LinkedLandRecordSummary> records = Collections.emptyList();
        int count = 0;
        if (doc.getLinkedLandRecords() != null) {
            count = doc.getLinkedLandRecords().size();
            records = doc.getLinkedLandRecords().stream()
                    .map(LinkedLandRecordSummary::from)
                    .collect(Collectors.toList());
        }

        return new ResearchDocumentResponse(
                doc.getId(),
                doc.getTitle(),
                doc.getDescription(),
                doc.getDocumentType(),
                doc.getAuthors(),
                doc.getOrganization(),
                doc.getPublicationDate(),
                doc.getSourceUrl(),
                doc.getFileUrl(),
                doc.getLanguage(),
                doc.getKeywords(),
                doc.getAbstractText(),
                doc.getStatus(),
                creatorId,
                creatorName,
                doc.getCreatedAt(),
                doc.getUpdatedAt(),
                count,
                records
        );
    }
}
