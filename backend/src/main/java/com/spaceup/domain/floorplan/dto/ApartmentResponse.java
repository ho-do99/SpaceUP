package com.spaceup.domain.floorplan.dto;

import java.util.List;

import com.spaceup.domain.floorplan.entity.Apartment;

public record ApartmentResponse(
		Long id,
		String name,
		String roadAddress,
		String lotAddress,
		String region,
		List<FloorPlanVariantResponse> variants) {

	public ApartmentResponse(Apartment apartment) {
		this(apartment.getId(), apartment.getName(), apartment.getRoadAddress(), apartment.getLotAddress(),
				apartment.getRegion(), apartment.getVariants().stream().map(FloorPlanVariantResponse::new).toList());
	}
}
