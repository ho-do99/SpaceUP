package com.spaceup.domain.floorplan.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.floorplan.entity.FloorPlanVariant;

@Repository
public interface FloorPlanVariantRepository extends JpaRepository<FloorPlanVariant, Long> {
}
