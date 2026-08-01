package com.spaceup.domain.matching.dto;

import java.math.BigDecimal;

// ⭐ [시공사 추천 점수 고도화] 세부 점수를 그대로 보존해서 반환합니다. 리뷰/최종 점수는 소수점 둘째 자리까지
// 표현해야 해서 BigDecimal, 견적/일정 점수는 정수 구간표라 int로 유지합니다.
public record MatchingScoreResult(BigDecimal reviewScore, int priceScore, int scheduleScore, BigDecimal matchScore) {
}
