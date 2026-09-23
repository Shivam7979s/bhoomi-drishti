package com.bhoomidrishti.policy.repository;

import com.bhoomidrishti.landrecord.entity.LandRecordStatus;
import com.bhoomidrishti.policy.entity.ScenarioAffectedParcel;
import com.bhoomidrishti.policy.entity.ScenarioAffectedParcelId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScenarioAffectedParcelRepository
        extends JpaRepository<ScenarioAffectedParcel, ScenarioAffectedParcelId> {

    @Query("SELECT sap FROM ScenarioAffectedParcel sap WHERE sap.scenarioResult.id = :scenarioResultId")
    List<ScenarioAffectedParcel> findByScenarioResultId(@Param("scenarioResultId") UUID scenarioResultId);

    @Query("SELECT sap FROM ScenarioAffectedParcel sap WHERE sap.scenarioResult.id = :scenarioResultId")
    Page<ScenarioAffectedParcel> findByScenarioResultId(
            @Param("scenarioResultId") UUID scenarioResultId, Pageable pageable);

    @Query("SELECT (COUNT(sap) > 0) FROM ScenarioAffectedParcel sap WHERE sap.scenarioResult.id = :scenarioResultId AND sap.landRecord.id = :landRecordId")
    boolean existsByScenarioResultIdAndLandRecordId(
            @Param("scenarioResultId") UUID scenarioResultId,
            @Param("landRecordId") UUID landRecordId);

    @Query("SELECT COUNT(sap) FROM ScenarioAffectedParcel sap WHERE sap.scenarioResult.id = :scenarioResultId")
    long countByScenarioResultId(@Param("scenarioResultId") UUID scenarioResultId);

    @Query("SELECT COUNT(sap) FROM ScenarioAffectedParcel sap WHERE sap.scenarioResult.id = :scenarioResultId AND sap.status = :status")
    long countByScenarioResultIdAndStatus(
            @Param("scenarioResultId") UUID scenarioResultId,
            @Param("status") LandRecordStatus status);
}
