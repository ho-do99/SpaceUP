package com.spaceup.domain.request.dto;

import com.spaceup.domain.material.entity.MaterialTheme;

import jakarta.validation.constraints.Positive;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [프론트 연동] PATCH /api/requests/{requestId} - 값을 보낸 필드만 수정되는 부분 수정 요청.
// 화면 흐름상 주택정보(region~monthlyRent)는 앞쪽에서, 예산/일정/요청항목은 뒤쪽에서 채워집니다.
@Getter
@Setter
@NoArgsConstructor
public class RequestUpdateRequest {

	private String region;
	private String propertyType;
	@Positive(message = "전용면적은 0보다 커야 합니다.")
	private Double areaM2;
	private Long deposit;
	private Long monthlyRent;

	private Long targetRent;
	private Long budgetMin;
	private Long budgetMax;
	private String desiredDate;
	private String requestedItems;

	private MaterialTheme selectedTheme;
	private Long selectedWallpaperProductId;
	private Long selectedFlooringProductId;
	private Long selectedLightingProductId;
}
