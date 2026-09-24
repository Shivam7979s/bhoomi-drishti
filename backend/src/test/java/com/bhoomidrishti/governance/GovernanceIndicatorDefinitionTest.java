package com.bhoomidrishti.governance;

import static org.assertj.core.api.Assertions.assertThat;

import com.bhoomidrishti.governance.dto.GovernanceIndicatorDefinitionResponse;
import com.bhoomidrishti.governance.entity.AggregationMethod;
import com.bhoomidrishti.governance.entity.GovernanceIndicatorDefinition;
import com.bhoomidrishti.governance.entity.IndicatorCategory;
import com.bhoomidrishti.governance.entity.IndicatorUnit;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class GovernanceIndicatorDefinitionTest {

    @Test
    @DisplayName("Should create indicator definition with default calculation version and active status")
    void testCreateDefinitionDefaults() {
        GovernanceIndicatorDefinition def = new GovernanceIndicatorDefinition(
                "DISPUTED_PARCEL_COUNT",
                "Disputed Parcel Count",
                "Total number of parcels marked disputed",
                IndicatorCategory.STATUS_DISTRIBUTION,
                IndicatorUnit.COUNT,
                AggregationMethod.COUNT,
                "LAND_RECORD",
                null);

        assertThat(def.getCode()).isEqualTo("DISPUTED_PARCEL_COUNT");
        assertThat(def.getName()).isEqualTo("Disputed Parcel Count");
        assertThat(def.getCategory()).isEqualTo(IndicatorCategory.STATUS_DISTRIBUTION);
        assertThat(def.getUnit()).isEqualTo(IndicatorUnit.COUNT);
        assertThat(def.getAggregationMethod()).isEqualTo(AggregationMethod.COUNT);
        assertThat(def.getSourceDomain()).isEqualTo("LAND_RECORD");
        assertThat(def.getCalculationVersion()).isEqualTo("1.0");
        assertThat(def.isActive()).isTrue();
    }

    @Test
    @DisplayName("Should map entity to DTO correctly")
    void testDtoMapping() {
        UUID id = UUID.randomUUID();
        GovernanceIndicatorDefinition def = new GovernanceIndicatorDefinition(
                "AREA_BY_LAND_USE",
                "Total Area by Land Use",
                "Sum of land area by land use type",
                IndicatorCategory.LAND_USE,
                IndicatorUnit.SQ_METERS,
                AggregationMethod.SUM,
                "LAND_RECORD",
                "1.1");
        def.setId(id);

        GovernanceIndicatorDefinitionResponse dto = GovernanceIndicatorDefinitionResponse.fromEntity(def);

        assertThat(dto.id()).isEqualTo(id);
        assertThat(dto.code()).isEqualTo("AREA_BY_LAND_USE");
        assertThat(dto.name()).isEqualTo("Total Area by Land Use");
        assertThat(dto.category()).isEqualTo(IndicatorCategory.LAND_USE);
        assertThat(dto.unit()).isEqualTo(IndicatorUnit.SQ_METERS);
        assertThat(dto.aggregationMethod()).isEqualTo(AggregationMethod.SUM);
        assertThat(dto.calculationVersion()).isEqualTo("1.1");
        assertThat(dto.active()).isTrue();
    }
}
