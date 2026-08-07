package com.spaceup.domain.visit.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.member.entity.Member;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SiteVisitService {

	private final SiteVisitRepository siteVisitRepository;
	private final QuoteRequestRepository quoteRequestRepository;
	private final NotificationService notificationService;

	@Transactional
	public void createIfAbsent(QuoteRequest request, Member contractor) {
		if (siteVisitRepository.existsByRequestIdAndContractorId(request.getId(), contractor.getId())) {
			return;
		}
		siteVisitRepository.save(SiteVisit.builder().request(request).contractor(contractor).build());
	}

	public SiteVisitResponse getByRequest(Long requestId, Long contractorId, Long memberId) {
		QuoteRequest request = quoteRequestRepository.findById(requestId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
		if (request.getOwner().getId().equals(memberId)) {
			if (contractorId != null) {
				return new SiteVisitResponse(findByRequestOrThrow(requestId, contractorId));
			}
			List<SiteVisit> visits = siteVisitRepository.findByRequestId(requestId);
			if (visits.size() != 1) {
				throw new IllegalArgumentException("여러 시공사의 방문 일정이 있으면 contractorId가 필요합니다.");
			}
			return new SiteVisitResponse(visits.get(0));
		}
		if (contractorId != null && !contractorId.equals(memberId)) {
			throw new ForbiddenAccessException("다른 시공사의 방문 일정에는 접근할 수 없습니다.");
		}
		return new SiteVisitResponse(findByRequestOrThrow(requestId, memberId));
	}

	@Transactional
	public SiteVisitResponse register(Long requestId, Long contractorId, LocalDate visitDate, LocalTime visitTime,
			String managerName, String note) {
		SiteVisit visit = findByRequestOrThrow(requestId, contractorId);
		validateContractor(visit, contractorId);
		visit.schedule(visitDate, visitTime, managerName, note);
		notificationService.notify(visit.getRequest().getOwner().getId(), NotificationType.VISIT,
				"현장방문 일정이 등록되었습니다",
				String.format("%s 시공사가 %s %s 방문할 예정입니다.", visit.getContractor().getName(), visitDate, visitTime));
		return new SiteVisitResponse(visit);
	}

	@Transactional
	public SiteVisitResponse requestChange(Long visitId, Long landlordId, LocalDate requestedDate,
			LocalTime requestedTime, String reason) {
		SiteVisit visit = findOrThrow(visitId);
		validateLandlord(visit.getRequest(), landlordId);
		visit.requestChange(requestedDate, requestedTime, reason);
		notificationService.notify(visit.getContractor().getId(), NotificationType.VISIT,
				"방문 일정 변경 요청이 도착했습니다",
				String.format("희망 일정: %s %s (%s)", requestedDate, requestedTime, reason));
		return new SiteVisitResponse(visit);
	}

	@Transactional
	public SiteVisitResponse acceptChange(Long visitId, Long contractorId) {
		SiteVisit visit = findOrThrow(visitId);
		validateContractor(visit, contractorId);
		visit.acceptChangeRequest();
		notificationService.notify(visit.getRequest().getOwner().getId(), NotificationType.VISIT,
				"방문 일정 변경 요청을 수락했습니다",
				String.format("%s %s로 방문 일정이 확정되었습니다.", visit.getVisitDate(), visit.getVisitTime()));
		return new SiteVisitResponse(visit);
	}

	@Transactional
	public SiteVisitResponse propose(Long visitId, Long contractorId, LocalDate visitDate, LocalTime visitTime,
			String note) {
		SiteVisit visit = findOrThrow(visitId);
		validateContractor(visit, contractorId);
		visit.propose(visitDate, visitTime, note);
		notificationService.notify(visit.getRequest().getOwner().getId(), NotificationType.VISIT,
				"새 방문 일정을 제안했습니다", String.format("%s %s로 방문 일정을 제안드립니다.", visitDate, visitTime));
		return new SiteVisitResponse(visit);
	}

	@Transactional
	public SiteVisitResponse rejectChange(Long visitId, Long contractorId) {
		SiteVisit visit = findOrThrow(visitId);
		validateContractor(visit, contractorId);
		visit.rejectChangeRequest();
		notificationService.notify(visit.getRequest().getOwner().getId(), NotificationType.VISIT,
				"방문 일정 변경 요청을 거절했습니다",
				String.format("기존 일정(%s %s)을 유지합니다.", visit.getVisitDate(), visit.getVisitTime()));
		return new SiteVisitResponse(visit);
	}

	@Transactional
	public SiteVisitResponse complete(Long visitId, Long contractorId, String note) {
		SiteVisit visit = findOrThrow(visitId);
		validateContractor(visit, contractorId);
		visit.complete(note);
		notificationService.notify(visit.getRequest().getOwner().getId(), NotificationType.VISIT,
				"현장방문이 완료되었습니다", "현장방문이 완료되었습니다. 곧 견적서를 받아볼 수 있습니다.");
		return new SiteVisitResponse(visit);
	}

	private void validateContractor(SiteVisit visit, Long contractorId) {
		if (!visit.getContractor().getId().equals(contractorId)) {
			throw new ForbiddenAccessException("본인의 방문 일정만 처리할 수 있습니다.");
		}
	}

	private void validateLandlord(QuoteRequest request, Long landlordId) {
		if (!request.getOwner().getId().equals(landlordId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰의 방문 일정만 처리할 수 있습니다.");
		}
	}

	private SiteVisit findOrThrow(Long visitId) {
		return siteVisitRepository.findById(visitId)
				.orElseThrow(() -> new SiteVisitNotFoundException("존재하지 않는 방문 일정입니다: " + visitId));
	}

	private SiteVisit findByRequestOrThrow(Long requestId, Long contractorId) {
		return siteVisitRepository.findByRequestIdAndContractorId(requestId, contractorId)
				.orElseThrow(() -> new SiteVisitNotFoundException(
						"아직 생성되지 않은 방문 일정입니다: request=" + requestId + ", contractor=" + contractorId));
	}
}
