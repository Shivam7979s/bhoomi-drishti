package com.bhoomidrishti.governance.repository;

import com.bhoomidrishti.governance.entity.GovernanceIndicatorSnapshot;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GovernanceIndicatorSnapshotRepository extends JpaRepository<GovernanceIndicatorSnapshot, UUID> {

    List<GovernanceIndicatorSnapshot> findByProjectIdOrderByAsOfDesc(UUID projectId);

    List<GovernanceIndicatorSnapshot> findByIndicatorDefinitionIdOrderByAsOfDesc(UUID definitionId);

    List<GovernanceIndicatorSnapshot> findByScopeTypeOrderByAsOfDesc(GovernanceScopeType scopeType);

    List<GovernanceIndicatorSnapshot> findByScopeTypeAndStateAndDistrictOrderByAsOfDesc(
            GovernanceScopeType scopeType, String state, String district);

    @Query("""
           SELECT s FROM GovernanceIndicatorSnapshot s
           WHERE s.scopeType = :scopeType
             AND (:state IS NULL OR s.state = :state)
             AND (:district IS NULL OR s.district = :district)
             AND (:tehsil IS NULL OR s.tehsil = :tehsil)
             AND (:village IS NULL OR s.village = :village)
             AND (:projectId IS NULL OR s.project.id = :projectId)
             AND (:indicatorCode IS NULL OR s.indicatorDefinition.code = :indicatorCode)
           ORDER BY s.asOf DESC
           """)
    List<GovernanceIndicatorSnapshot> findSnapshotsByScopeHierarchy(
            @Param("scopeType") GovernanceScopeType scopeType,
            @Param("state") String state,
            @Param("district") String district,
            @Param("tehsil") String tehsil,
            @Param("village") String village,
            @Param("projectId") UUID projectId,
            @Param("indicatorCode") String indicatorCode);

    Optional<GovernanceIndicatorSnapshot> findTopByIndicatorDefinitionIdAndProjectIdOrderByAsOfDesc(
            UUID definitionId, UUID projectId);

    Optional<GovernanceIndicatorSnapshot> findTopByIndicatorDefinitionIdAndScopeTypeAndStateAndDistrictAndTehsilAndVillageOrderByAsOfDesc(
            UUID definitionId,
            GovernanceScopeType scopeType,
            String state,
            String district,
            String tehsil,
            String village);
}
