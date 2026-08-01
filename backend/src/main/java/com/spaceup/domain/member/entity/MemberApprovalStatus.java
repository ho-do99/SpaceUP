package com.spaceup.domain.member.entity;

/**
 * ⭐ [Figma 반영] 기존 boolean approved 하나로는 "심사 중 / 보완요청 / 승인완료" 3단계 워크플로우를 표현할 수
 * 없어서 enum으로 승격했습니다. LANDLORD/ADMIN은 가입 즉시 APPROVED, CONTRACTOR/MATERIAL_VENDOR는
 * PENDING으로 시작해 관리자가 APPROVED 또는 NEEDS_REVISION으로 처리합니다.
 */
public enum MemberApprovalStatus {
	PENDING, // 심사 대기/심사 중
	NEEDS_REVISION, // 보완 요청 (반려 사유 + 재제출 기한 포함)
	APPROVED // 승인 완료
}
