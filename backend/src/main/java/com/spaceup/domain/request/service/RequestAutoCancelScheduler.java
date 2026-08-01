package com.spaceup.domain.request.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.notification.entity.NotificationType;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestStatus;
import com.spaceup.domain.request.repository.QuoteRequestRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * ⭐ [Figma 반영] "7일 자동 취소 정책" 배치. 마지막 유효 활동(lastActivityAt) 이후 168시간이 지나면 의뢰를
 * 자동으로 CANCELED 처리하고, 144시간 시점엔 D-1 알림을 먼저 보냅니다.
 *
 * 자동취소 대상 상태: NEW/REVIEWING/QUOTE_REQUESTED/APPROVED (아직 진행 중인 것들만 - COMPLETED,
 * REJECTED, CANCELED, IN_PROGRESS는 대상에서 제외합니다. IN_PROGRESS는 이미 시공이 시작된 단계라 활동 여부와
 * 무관하게 자동취소하면 안 되기 때문입니다).
 *
 * 운영 반영 시 확인 필요: fixedDelay 주기는 우선 10분으로 잡아뒀습니다. 트래픽/서버 스펙에 맞게 조정하세요.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RequestAutoCancelScheduler {

	private static final List<RequestStatus> TRACKED_STATUSES = List.of(RequestStatus.NEW, RequestStatus.REVIEWING,
			RequestStatus.QUOTE_REQUESTED, RequestStatus.APPROVED);

	private final QuoteRequestRepository quoteRequestRepository;
	private final NotificationService notificationService;

	@Scheduled(fixedDelay = 10 * 60 * 1000L) // 10분마다 실행
	@Transactional
	public void run() {
		sendD1Warnings();
		autoCancelInactive();
	}

	private void sendD1Warnings() {
		LocalDateTime threshold = LocalDateTime.now().minusHours(144);
		List<QuoteRequest> targets = quoteRequestRepository.findByStatusInAndWarningSentFalseAndLastActivityAtBefore(
				TRACKED_STATUSES, threshold);
		for (QuoteRequest request : targets) {
			request.markWarningSent();
			notificationService.notify(request.getOwner().getId(), NotificationType.REQUEST, "의뢰 자동 취소 D-1 안내",
					String.format("%s 의뢰가 24시간 내 유효 활동이 없으면 자동 취소됩니다.", request.getRequestCode()));
			if (request.getContractor() != null) {
				notificationService.notify(request.getContractor().getId(), NotificationType.REQUEST,
						"의뢰 자동 취소 D-1 안내",
						String.format("%s 의뢰가 24시간 내 유효 활동이 없으면 자동 취소됩니다.", request.getRequestCode()));
			}
			log.info("[Request 자동취소 D-1 경고] requestId={}, code={}", request.getId(), request.getRequestCode());
		}
	}

	private void autoCancelInactive() {
		LocalDateTime threshold = LocalDateTime.now().minusHours(168);
		List<QuoteRequest> targets = quoteRequestRepository.findByStatusInAndLastActivityAtBefore(TRACKED_STATUSES,
				threshold);
		for (QuoteRequest request : targets) {
			request.cancel();
			notificationService.notify(request.getOwner().getId(), NotificationType.REQUEST, "의뢰가 자동 취소되었습니다",
					String.format("%s 의뢰가 168시간 동안 유효 활동이 없어 자동 취소되었습니다.", request.getRequestCode()));
			if (request.getContractor() != null) {
				notificationService.notify(request.getContractor().getId(), NotificationType.REQUEST,
						"의뢰가 자동 취소되었습니다",
						String.format("%s 의뢰가 168시간 동안 유효 활동이 없어 자동 취소되었습니다.", request.getRequestCode()));
			}
			log.info("[Request 자동취소] requestId={}, code={}", request.getId(), request.getRequestCode());
		}
	}
}
