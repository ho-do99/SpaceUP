package com.spaceup.domain.settlement.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.settlement.entity.Settlement;
import com.spaceup.domain.settlement.entity.SettlementStatus;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

	Page<Settlement> findByPartnerId(Long partnerId, Pageable pageable);

	long countByStatus(SettlementStatus status);

	// ⭐ [Figma 반영] 시공사 대시보드 "정산 예정 ₩13,680,000" 카드용. 정산 건이 하나도 없으면 null이 반환되므로
	// 호출부(ContractorProfileService)에서 null-safe하게 처리해야 합니다.
	@Query("SELECT SUM(s.payoutAmount) FROM Settlement s WHERE s.partner.id = :partnerId AND s.status = :status")
	Long sumPayoutAmountByPartnerIdAndStatus(@Param("partnerId") Long partnerId,
			@Param("status") SettlementStatus status);
}
