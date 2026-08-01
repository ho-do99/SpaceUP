package com.spaceup.domain.contractor.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [시공사 추천 점수] 견적 범위/가능 일정 - 마이페이지에서 시공사가 직접 입력
// ⭐ [시공사 추천 점수 고도화] 이 값들이 추천 점수 계산(예상 견적 적합도/일정 적합도)에 그대로 쓰여서, 값이 비어
// 있거나 뒤집혀 있으면(estimateMax < estimateMin) 계산 자체가 무의미해집니다 - 저장 시점에 막습니다.
@Getter
@Setter
@NoArgsConstructor
public class ContractorServiceInfoUpdateRequest {

	@NotNull(message = "예상 견적 최소값은 필수 입력 사항입니다.")
	@PositiveOrZero(message = "예상 견적 최소값은 0 이상이어야 합니다.")
	private Long estimateMin;

	@NotNull(message = "예상 견적 최대값은 필수 입력 사항입니다.")
	private Long estimateMax;

	@NotNull(message = "가능 일정은 필수 입력 사항입니다.")
	private LocalDate availableFromDate;

	@AssertTrue(message = "예상 견적 최대값은 최소값 이상이어야 합니다.")
	public boolean isEstimateRangeValid() {
		return estimateMin == null || estimateMax == null || estimateMax >= estimateMin;
	}
}
