package com.spaceup.domain.floorplan.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FloorPlanVariantCreateRequest {

	@NotNull(message = "전용면적은 필수입니다.")
	@Positive(message = "전용면적은 0보다 커야 합니다.")
	private Double exclusiveAreaM2;

	private Double supplyAreaM2;
	private String typeLabel;
	private Integer roomCount;
	private String floorPlanImageUrl;
}
