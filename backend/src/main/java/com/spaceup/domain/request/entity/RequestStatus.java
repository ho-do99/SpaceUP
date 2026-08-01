package com.spaceup.domain.request.entity;

/**
 * ⭐ PDF 화면에 등장하는 의뢰 상태값들을 그대로 매핑했습니다. (의뢰목록: 신규/검토중/견적요청, 의뢰상세: 승인/거절,
 * 관리자-요청관리: 견적대기/시공진행/시공완료/취소)
 */
public enum RequestStatus {
	NEW, // 신규 (임대인이 시공사에 의뢰를 보낸 직후)
	REVIEWING, // 검토 중 (시공사가 의뢰 상세를 확인 중)
	QUOTE_REQUESTED, // 견적 요청됨 (임대인이 승인 → 시공사에게 견적 작성 요청)
	APPROVED, // 의뢰 승인 (시공사가 현장 방문/견적 진행을 확정)
	REJECTED, // 의뢰 거절
	IN_PROGRESS, // 시공 진행 중 (견적 확정 후)
	COMPLETED, // 시공 완료
	CANCELED // 취소
}
