package com.bhoomidrishti.landrecord.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Geometry;

/**
 * A prototype land parcel.
 *
 * <p>Privacy: {@code ownerIdentifier} is a non-sensitive placeholder for this prototype and must
 * never contain real personal or government identifiers (Aadhaar, PAN, phone numbers, ...).
 *
 * <p>{@code boundary} is a real PostGIS geometry (POLYGON/MULTIPOLYGON, SRID 4326) mapped with
 * Hibernate Spatial - never faked as a String or hand-serialized JSON.
 */
@Entity
@Table(name = "land_records")
public class LandRecord {

    @Id
    @Column(columnDefinition = "uuid", nullable = false, updatable = false)
    private UUID id;

    // Not globally unique on purpose: this prototype assumes no government uniqueness rules.
    @Column(name = "parcel_number", nullable = false, length = 64)
    private String parcelNumber;

    @Column(name = "survey_number", length = 64)
    private String surveyNumber;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(nullable = false, length = 100)
    private String tehsil;

    @Column(nullable = false, length = 100)
    private String village;

    @Column(name = "land_area_sq_meters", nullable = false, precision = 14, scale = 2)
    private BigDecimal landAreaSqMeters;

    @Enumerated(EnumType.STRING)
    @Column(name = "land_use_type", nullable = false, length = 32)
    private LandUseType landUseType;

    @Enumerated(EnumType.STRING)
    @Column(name = "ownership_type", nullable = false, length = 32)
    private OwnershipType ownershipType;

    @Column(name = "owner_name", nullable = false, length = 120)
    private String ownerName;

    /** Non-sensitive prototype placeholder only - never a real identity document. */
    @Column(name = "owner_identifier", length = 64)
    private String ownerIdentifier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private LandRecordStatus status;

    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(name = "boundary", nullable = false, columnDefinition = "geometry(Geometry,4326)")
    private Geometry boundary;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }

        // --- Accessors (generated) ---

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getParcelNumber() {
        return parcelNumber;
    }

    public void setParcelNumber(String parcelNumber) {
        this.parcelNumber = parcelNumber;
    }

    public String getSurveyNumber() {
        return surveyNumber;
    }

    public void setSurveyNumber(String surveyNumber) {
        this.surveyNumber = surveyNumber;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getTehsil() {
        return tehsil;
    }

    public void setTehsil(String tehsil) {
        this.tehsil = tehsil;
    }

    public String getVillage() {
        return village;
    }

    public void setVillage(String village) {
        this.village = village;
    }

    public BigDecimal getLandAreaSqMeters() {
        return landAreaSqMeters;
    }

    public void setLandAreaSqMeters(BigDecimal landAreaSqMeters) {
        this.landAreaSqMeters = landAreaSqMeters;
    }

    public LandUseType getLandUseType() {
        return landUseType;
    }

    public void setLandUseType(LandUseType landUseType) {
        this.landUseType = landUseType;
    }

    public OwnershipType getOwnershipType() {
        return ownershipType;
    }

    public void setOwnershipType(OwnershipType ownershipType) {
        this.ownershipType = ownershipType;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getOwnerIdentifier() {
        return ownerIdentifier;
    }

    public void setOwnerIdentifier(String ownerIdentifier) {
        this.ownerIdentifier = ownerIdentifier;
    }

    public LandRecordStatus getStatus() {
        return status;
    }

    public void setStatus(LandRecordStatus status) {
        this.status = status;
    }

    public Geometry getBoundary() {
        return boundary;
    }

    public void setBoundary(Geometry boundary) {
        this.boundary = boundary;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
