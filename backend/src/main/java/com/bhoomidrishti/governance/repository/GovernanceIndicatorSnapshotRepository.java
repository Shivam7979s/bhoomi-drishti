package com.bhoomidrishti.governance.repository;

import com.bhoomidrishti.governance.entity.GovernanceIndicatorSnapshot;
import com.bhoomidrishti.governance.entity.GovernanceScopeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GovernanceIndicatorSnapshotRepository extends JpaRepository<GovernanceIndicatorSnapshot, UUID> {

    List<GovernanceIndicatorSnapshot> findByProjectIdOrderByAsOfDesc(UUID projectId);

    List<GovernanceIndicatorSnapshot> findByIndicatorDefinitionIdOrderByAsOfDesc(UUID definitionId);

    List<GovernanceIndicatorSnapshot> findByScopeTypeOrderByAsOfDesc(GovernanceScopeType scopeType);

    List<GovernanceIndicatorSnapshot> findByScopeTypeAndStateAndDistrictOrderByAsOfDesc(
            GovernanceScopeType scopeType, String state, String district);

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
