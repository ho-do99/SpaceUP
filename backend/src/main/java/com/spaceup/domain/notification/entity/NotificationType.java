package com.spaceup.domain.notification.entity;

// ⭐ PDF "알림센터" 화면 필터 탭(전체/의뢰/견적/일정/정산) + 실제 발생 이벤트 기준으로 세분화
// ⭐ [Figma 반영] 알림 필터에 "정산" 탭이 있는데 기존 enum엔 대응 타입이 없어 SETTLEMENT을 추가했습니다.
public enum NotificationType {
	QUOTE, // 새 견적 요청/도착
	SCHEDULE, // 시공 일정 확정/변경
	REQUEST, // 의뢰 상태 변경
	SETTLEMENT // 정산 생성/완료
}
