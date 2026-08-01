package com.spaceup.domain.matching.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

// ⭐ [시공사 추천 점수] "화면에 필요한 데이터" 그대로 매핑
// ⭐ [시공사 추천 점수 고도화] 세부 점수(reviewScore/priceScore/scheduleScore)와 추천 순위를 추가해서,
// 프론트에서 "왜 이 순서인지" 점수 breakdown을 그대로 보여줄 수 있게 했습니다. matchScore는 소수점 둘째 자리까지
// 표현하기 위해 int에서 BigDecimal로 바꿨습니다.
public record RecommendedContractorResponse(Long contractorId, String companyName, Double rating,
		Integer reviewCount, Long estimateMin, Long estimateMax, LocalDate availableDate, BigDecimal reviewScore,
		int priceScore, int scheduleScore, BigDecimal matchScore, int recommendationRank) {
}
