package com.spaceup.domain.analysis.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ 외부 ML 파이프라인이 분석을 끝내고 결과를 서버로 콜백할 때 보내는 요청 (또는 관리자가 수동 보정할 때도 사용)
@Getter
@Setter
@NoArgsConstructor
public class AnalysisJobResultRequest {

	private Integer roomCount;
	private Integer bathroomCount;
	private Boolean hasBalcony;
	private String kitchenType;
	private Integer spaceScore;
	private Integer conditionScore;
	private String issueTags; // "조명 어두움,바닥 노후화" 콤마 구분

	// ⭐ [Figma 반영] "사용자가 받은 예상 견적" 범위
	private Long estimatedQuoteMin;
	private Long estimatedQuoteMax;

	// ⭐ [Figma 반영] "ROI 요약" - 예상 월세 상승 범위 + 예상 회수 기간(개월)
	private Long expectedRentIncreaseMin;
	private Long expectedRentIncreaseMax;
	private Integer paybackPeriodMonthsMin;
	private Integer paybackPeriodMonthsMax;
}
