package com.spaceup.domain.order.entity;

// ⭐ PDF "주문/발주 관리" 파이프라인 탭 그대로 매핑
public enum OrderStatus {
	NEW, // 신규 주문
	READY_TO_SHIP, // 출고 준비
	SHIPPING, // 배송 중
	COMPLETED // 완료
}
