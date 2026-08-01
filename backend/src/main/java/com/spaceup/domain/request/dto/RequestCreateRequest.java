package com.spaceup.domain.request.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ PDF "02 임대 정보 입력" 화면 입력값 그대로 매핑
@Getter
@Setter
@NoArgsConstructor
public class RequestCreateRequest {

	@NotBlank(message = "지역은 필수 입력 사항입니다.")
	private String region;

	@NotBlank(message = "주택 유형은 필수 입력 사항입니다.")
	private String propertyType;

	@NotNull(message = "전용 면적은 필수 입력 사항입니다.")
	@Positive(message = "전용 면적은 0보다 커야 합니다.")
	private Double areaM2;

	private Long deposit;
	private Long monthlyRent;
	private Long targetRent;

	// ⭐ (레거시) 단일 예산값 - 이전 클라이언트 호환용. 신규 클라이언트는 budgetMin/budgetMax를 사용하세요.
	private Long budget;

	// ⭐ [Figma 반영] "집주인 예산" 범위 입력 (예: 300~500만원)
	private Long budgetMin;
	private Long budgetMax;

	private String desiredDate;
	private String requestedItems;
}
