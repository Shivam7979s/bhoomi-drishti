package com.bhoomidrishti.governance.repository;

import com.bhoomidrishti.governance.entity.GovernanceIndicatorDefinition;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GovernanceIndicatorDefinitionRepository extends JpaRepository<GovernanceIndicatorDefinition, UUID> {

    Optional<GovernanceIndicatorDefinition> findByCode(String code);

    List<GovernanceIndicatorDefinition> findByActiveTrueOrderByCategoryAscNameAsc();

    List<GovernanceIndicatorDefinition> findByCategory(IndicatorCategory category);

    boolean existsByCode(String code);
}
