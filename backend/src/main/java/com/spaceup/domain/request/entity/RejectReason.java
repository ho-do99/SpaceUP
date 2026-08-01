package com.spaceup.domain.request.entity;

// ⭐ [Figma 반영] "의뢰 거절 사유" 선택 화면 - 기존에는 사유 없이 그냥 REJECTED로만 바뀌었습니다.
public enum RejectReason {
	REGION_NOT_SUPPORTED, // 지역 미지원
	BUDGET_MISMATCH, // 예산 범위 불일치
	SPECIALTY_MISMATCH, // 전문 분야 불일치
	SCHEDULE_CONFLICT, // 일정 조율 불가
	OTHER // 기타 (rejectReasonDetail에 상세 사유 기재)
}
