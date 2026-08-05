package com.spaceup.domain.visit.service;

import java.time.LocalDate;
import java.time.LocalTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.notification.entity.NotificationType;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.visit.dto.SiteVisitResponse;
import com.spaceup.domain.visit.entity.SiteVisit;
import com.spaceup.domain.visit.repository.SiteVisitRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.RequestNotFoundException;
import com.spaceup.global.error.SiteVisitNotFoundException;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "현장방문 예약" 화면 - 견적 작성 이전, 의뢰 승인 직후부터 시작되는 흐름
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SiteVisitService {

	private final SiteVisitRepository siteVisitRepository;
	private final QuoteRequestRepository quoteRequestRepository;
	private final NotificationService notificationService;

	// ⭐ RequestService.approve() 시점에 호출되는 확장 지점 - 이미 있으면 아무 것도 하지 않습니다.
	@Transactional
	public void createIfAbsent(QuoteRequest request) {
		if (siteVisitRepository.existsByRequestId(request.getId())) {
			return;
		}
		siteVisitRepository.save(SiteVisit.builder().request(request).build());
	}

	public SiteVisitResponse getByRequest(Long requestId, Long memberId) {
		SiteVisit visit = findByRequestOrThrow(requestId);
		validateParticipant(visit.getRequest(), memberId);
		return new SiteVisitResponse(visit);
	}

	// ⭐ PDF "방문 일정 등록" 버튼 - 시공사가 최초로 날짜/시간을 등록 (배정받은 시공사 본인만)
	@Transactional
	public SiteVisitResponse register(Long requestId, Long contractorId, LocalDate visitDate, LocalTime visitTime,
			String managerName, String note) {
		SiteVisit visit = findByRequestOrThrow(requestId);
		validateContractor(visit.getRequest(), contractorId);
		visit.schedule(visitDate, visitTime, managerName, note);

		notificationService.notify(visit.getRequest().getOwner().getId(), NotificationType.VISIT,
				"현장방문 일정이 등록되었습니다",
				String.format("%s %s 방문이 예정되어 있습니다.", visitDate, visitTime));
		return new SiteVisitResponse(visit);
	}

	// ⭐ [Figma 반영] 임대인(고객)이 다른 일정을 요청
	@Transactional
	public SiteVisitResponse requestChange(Long visitId, Long landlordId, LocalDate requestedDate,
			LocalTime requestedTime, String reason) {
		SiteVisit visit = findOrThrow(visitId);
		validateLandlord(visit.getRequest(), landlordId);
		visit.requestChange(requestedDate, requestedTime, reason);

		notificationService.notify(visit.getRequest().getContractor().getId(), NotificationType.VISIT,
				"방문 일정 변경 요청이 도착했습니다",
				String.format("희망 일정: %s %s (%s)", requestedDate, requestedTime, reason));
		return new SiteVisitResponse(visit);
	}

	// ⭐ 시공사가 임대인의 변경 요청을 수락
	@Transactional
	public SiteVisitResponse acceptChange(Long visitId, Long contractorId) {
		SiteVisit visit = findOrThrow(visitId);
		validateContractor(visit.getRequest(), contractorId);
		visit.acceptChangeRequest();

		notificationService.notify(visit.getRequest().getOwner().getId(), NotificationType.VISIT,
				"방문 일정 변경 요청이 수락되었습니다",
				String.format("%s %s로 방문 일정이 확정되었습니다.", visit.getVisitDate(), visit.getVisitTime()));
		return new SiteVisitResponse(visit);
	}

	// ⭐ 시공사가 다른 일정을 역제안("다른 일정 제안")
	@Transactional
	public SiteVisitResponse propose(Long visitId, Long contractorId, LocalDate visitDate, LocalTime visitTime,
			String note) {
		SiteVisit visit = findOrThrow(visitId);
		validateContractor(visit.getRequest(), contractorId);
		visit.schedule(visitDate, visitTime, visit.getManagerName(), note);

		notificationService.notify(visit.getRequest().getOwner().getId(), NotificationType.VISIT,
				"새 방문 일정이 제안되었습니다", String.format("%s %s로 방문 일정을 제안드립니다.", visitDate, visitTime));
		return new SiteVisitResponse(visit);
	}

	// ⭐ 시공사가 임대인의 변경 요청을 거절 - 기존 일정 유지
	@Transactional
	public SiteVisitResponse rejectChange(Long visitId, Long contractorId) {
		SiteVisit visit = findOrThrow(visitId);
		validateContractor(visit.getRequest(), contractorId);
		visit.rejectChangeRequest();

		notificationService.notify(visit.getRequest().getOwner().getId(), NotificationType.VISIT,
				"방문 일정 변경 요청이 거절되었습니다",
				String.format("기존 일정(%s %s)이 그대로 유지됩니다.", visit.getVisitDate(), visit.getVisitTime()));
		return new SiteVisitResponse(visit);
	}

	@Transactional
	public SiteVisitResponse complete(Long visitId, Long contractorId, String note) {
		SiteVisit visit = findOrThrow(visitId);
		validateContractor(visit.getRequest(), contractorId);
		visit.complete(note);

		notificationService.notify(visit.getRequest().getOwner().getId(), NotificationType.VISIT, "현장방문이 완료되었습니다",
				"현장방문이 완료되었습니다. 곧 견적서를 받아보실 수 있습니다.");
		return new SiteVisitResponse(visit);
	}

	private void validateParticipant(QuoteRequest request, Long memberId) {
		boolean isOwner = request.getOwner().getId().equals(memberId);
		boolean isContractor = request.getContractor() != null && request.getContractor().getId().equals(memberId);
		if (!isOwner && !isContractor) {
			throw new ForbiddenAccessException("본인이 참여 중인 의뢰의 방문 일정만 조회할 수 있습니다.");
		}
	}

	private void validateContractor(QuoteRequest request, Long contractorId) {
		if (request.getContractor() == null || !request.getContractor().getId().equals(contractorId)) {
			throw new ForbiddenAccessException("본인에게 배정된 의뢰만 처리할 수 있습니다.");
		}
	}

	private void validateLandlord(QuoteRequest request, Long landlordId) {
		if (!request.getOwner().getId().equals(landlordId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰만 처리할 수 있습니다.");
		}
	}

	private SiteVisit findOrThrow(Long visitId) {
		return siteVisitRepository.findById(visitId)
				.orElseThrow(() -> new SiteVisitNotFoundException("존재하지 않는 방문 일정입니다: " + visitId));
	}

	private SiteVisit findByRequestOrThrow(Long requestId) {
		if (!quoteRequestRepository.existsById(requestId)) {
			throw new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId);
		}
		return siteVisitRepository.findByRequestId(requestId)
				.orElseThrow(() -> new SiteVisitNotFoundException("아직 생성되지 않은 방문 일정입니다 (의뢰 승인 이후 생성됩니다): " + requestId));
	}
}
