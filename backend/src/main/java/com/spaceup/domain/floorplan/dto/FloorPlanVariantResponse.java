package com.spaceup.domain.floorplan.dto;

import com.spaceup.domain.floorplan.entity.FloorPlanVariant;

public record FloorPlanVariantResponse(
		Long id,
		Double exclusiveAreaM2,
		Double supplyAreaM2,
		Double exclusivePyeong,
		Double supplyPyeong,
		String typeLabel,
		Integer roomCount,
		String floorPlanImageUrl) {

	private static final double M2_PER_PYEONG = 3.305785;

	public FloorPlanVariantResponse(FloorPlanVariant variant) {
		this(variant.getId(), variant.getExclusiveAreaM2(), variant.getSupplyAreaM2(),
				toPyeong(variant.getExclusiveAreaM2()), toPyeong(variant.getSupplyAreaM2()), variant.getTypeLabel(),
				variant.getRoomCount(), variant.getFloorPlanImageUrl());
	}

	private static Double toPyeong(Double areaM2) {
		return areaM2 != null ? Math.round(areaM2 / M2_PER_PYEONG * 10) / 10.0 : null;
	}
}
