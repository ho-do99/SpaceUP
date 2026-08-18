package com.spaceup.domain.quote.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.quote.entity.ContractorQuote;
import com.spaceup.domain.quote.entity.QuotePhase;
import com.spaceup.domain.quote.entity.QuoteStatus;

@Repository
public interface ContractorQuoteRepository extends JpaRepository<ContractorQuote, Long> {

	List<ContractorQuote> findByRequestId(Long requestId);

	List<ContractorQuote> findByContractorId(Long contractorId);

	// ⭐ [Figma 반영] 시공사 대시보드 "견적 전송 8건" 카드용
	long countByContractorIdAndStatus(Long contractorId, QuoteStatus status);

	// ⭐ [고도화] "임대인 예상 공사비 vs 시공사 확정 견적" 비교 화면용 - 해당 의뢰에서 수락된 견적을 조회
	Optional<ContractorQuote> findFirstByRequestIdAndStatusOrderByUpdatedAtDesc(Long requestId, QuoteStatus status);

	Optional<ContractorQuote> findFirstByRequestIdAndPhaseAndStatusOrderByUpdatedAtDesc(Long requestId,
			QuotePhase phase, QuoteStatus status);
}
