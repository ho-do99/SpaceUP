package com.spaceup.domain.quote.entity;

public enum QuoteStatus {
	DRAFT, // 임시 저장 (PDF "임시 저장" 버튼)
	SUBMITTED, // 임대인에게 발송됨 (PDF "견적 제안 보내기")
	ACCEPTED, // 임대인이 최종 선택
	REJECTED // 임대인이 거절
}
