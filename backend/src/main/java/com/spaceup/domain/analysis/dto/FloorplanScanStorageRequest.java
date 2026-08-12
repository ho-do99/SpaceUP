package com.spaceup.domain.analysis.dto;

import jakarta.validation.constraints.NotNull;

public record FloorplanScanStorageRequest(@NotNull(message = "floorPlanVariantId는 필수입니다.") Long floorPlanVariantId) {
}
