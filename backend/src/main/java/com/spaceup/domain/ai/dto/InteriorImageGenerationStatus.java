package com.spaceup.domain.ai.dto;

// ⭐ [프론트 연동] "생성 중" 화면 새로고침 복구용. 생성 자체가 동기 호출이라 별도 상태 테이블이 없어서,
// COMPLETED는 request_image(AI_GENERATED) 존재 여부로, IN_PROGRESS는 서버의 인메모리 진행 중 표시로
// 판단합니다. 두 조건 다 아니면 NOT_STARTED입니다.
public enum InteriorImageGenerationStatus {
	NOT_STARTED, // 이 의뢰로 생성을 요청한 적이 없음 - 신규 생성(POST) 필요
	IN_PROGRESS, // 생성이 진행 중(다른 탭/이전 요청이 아직 처리 중) - 완료될 때까지 대기 후 재조회 권장
	COMPLETED // 생성 완료 - imageUrls에 결과가 들어있음
}
