package com.spaceup.domain.request.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestStatus;

@Repository
public interface QuoteRequestRepository extends JpaRepository<QuoteRequest, Long> {

	Optional<QuoteRequest> findByRequestCode(String requestCode);

	// ⭐ PDF "의뢰 목록" 화면: 시공사가 본인에게 온 의뢰를 상태별로 조회
	List<QuoteRequest> findByContractorIdAndStatus(Long contractorId, RequestStatus status);

	// ⭐ 목록이 늘어날 걸 대비해 Pageable 버전을 기본으로 씁니다 (컨트롤러에서 page/size/sort로 호출)
	Page<QuoteRequest> findByContractorId(Long contractorId, Pageable pageable);

	// ⭐ PDF "마이페이지 - 견적 요청 내역" 화면: 임대인이 본인이 보낸 의뢰 목록 조회
	Page<QuoteRequest> findByOwnerId(Long ownerId, Pageable pageable);

	// ⭐ [Figma 반영] "7일 자동 취소" 배치용: 아직 진행 중(대기 상태)인데 lastActivityAt이 기준시각보다 오래된 것들
	List<QuoteRequest> findByStatusInAndLastActivityAtBefore(List<RequestStatus> statuses, LocalDateTime threshold);

	// ⭐ 144시간(D-1) 알림 대상: 경고 미발송 + 기준시각(144h 전)보다 오래된 것들
	List<QuoteRequest> findByStatusInAndWarningSentFalseAndLastActivityAtBefore(List<RequestStatus> statuses,
			LocalDateTime threshold);

	// ⭐ [Figma 반영] 시공사 대시보드 "신규 리드/검토중" 카드용
	long countByContractorIdAndStatus(Long contractorId, RequestStatus status);
}
