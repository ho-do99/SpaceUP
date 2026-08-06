package com.spaceup.domain.project.entity;

// ⭐ [프론트 연동] ContractorProjectStatus와 1:1 대응
public enum ProjectStatus {
	VISIT_SCHEDULED, // 계약 완료, 방문 예정 (현장방문 미완료 상태로 계약 전환된 경우)
	START_SCHEDULED, // 착수 예정 (현장방문 완료 후 계약 전환된 경우 기본값)
	IN_PROGRESS, // 시공 중
	COMPLETION_REQUESTED, // 시공사가 완료 요청 - 임대인 확인 대기
	COMPLETED // 임대인이 완료 확인
}
