package com.spaceup.domain.visit.entity;

public enum SiteVisitStatus {
	UNSCHEDULED, // 미등록 - 의뢰 승인 직후 기본값
	SCHEDULED, // 방문 예정
	CHANGE_REQUESTED, // 임대인이 일정 변경을 요청함
	COMPLETED // 방문 완료
}
