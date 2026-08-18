package com.spaceup.domain.floorplan.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.floorplan.entity.FloorPlanVariant;

@Repository
public interface FloorPlanVariantRepository extends JpaRepository<FloorPlanVariant, Long> {

	Optional<FloorPlanVariant> findFirstByApartmentRoadAddressAndExclusiveAreaM2AndFloorPlanImageUrlIsNotNull(
			String roadAddress, Double exclusiveAreaM2);
}
