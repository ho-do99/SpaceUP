package com.spaceup.domain.admin.dto;

// ⭐ PDF "전체 운영 현황(관리자 대시보드)" 화면 상단 요약 카드
public record AdminDashboardResponse(long totalLandlords, long totalContractors, long totalMaterialVendors,
		long pendingContractorApprovals, long pendingMaterialVendorApprovals, long totalRequests,
		long pendingSettlements) {
}
