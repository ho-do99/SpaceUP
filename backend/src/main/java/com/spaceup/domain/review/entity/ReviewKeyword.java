package com.spaceup.domain.review.entity;

// ⭐ [프론트 연동] ContractorReviewKeyword와 1:1 대응 - 자유 태그가 아닌 고정 4종 중 선택
public enum ReviewKeyword {
	SCHEDULE_KEPT("일정을 잘 지켰어요"),
	CLEAN_FINISH("마감이 깔끔해요"),
	DETAILED_CONSULT("상담이 자세해요"),
	FAST_COMMUNICATION("소통이 빨라요");

	private final String label;

	ReviewKeyword(String label) {
		this.label = label;
	}

	public String getLabel() {
		return label;
	}
}
