package com.spaceup.domain.contractor.dto;

import lombok.Getter;

// ⭐ [Figma 반영] "시공사 대시보드" 화면 상단 요약 카드. 정확한 영업 파이프라인 단계 구분(신규/검토/전송/선택/계약)은
// 기획 확정이 필요해 최대한 근접하게 근사치로 매핑했습니다 - 상세 매핑 근거는 API 명세서 비고 참고.
@Getter
public class ContractorDashboardResponse {
	private final long newLeadsCount; // 신규 리드 (배정만 되고 아직 검토 전 = REVIEWING 상태)
	private final long quoteRequestedCount; // 검토 중 (임대인 승인 후 견적작성 대기 = QUOTE_REQUESTED 상태)
	private final long quoteSentCount; // 견적 전송 (SUBMITTED 상태의 견적 건수)
	private final long contractPendingCount; // 계약 대기 (ACCEPTED 상태의 견적 건수)
	private final long pendingSettlementAmount; // 정산 예정 금액 합계(원)

	public ContractorDashboardResponse(long newLeadsCount, long quoteRequestedCount, long quoteSentCount,
			long contractPendingCount, long pendingSettlementAmount) {
		this.newLeadsCount = newLeadsCount;
		this.quoteRequestedCount = quoteRequestedCount;
		this.quoteSentCount = quoteSentCount;
		this.contractPendingCount = contractPendingCount;
		this.pendingSettlementAmount = pendingSettlementAmount;
	}
}
