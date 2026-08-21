package com.spaceup.domain.notification.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.dto.NotificationResponse;
import com.spaceup.domain.notification.entity.Notification;
import com.spaceup.domain.notification.entity.NotificationType;
import com.spaceup.domain.notification.repository.NotificationRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.NotificationNotFoundException;
import com.spaceup.global.realtime.RealtimeDomainEvent;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

	private final NotificationRepository notificationRepository;
	private final MemberRepository memberRepository;
	private final ApplicationEventPublisher eventPublisher;

	private static final int TITLE_MAX_LENGTH = 100;
	private static final int CONTENT_MAX_LENGTH = 300;

	// ⭐ 이 메서드가 핵심 확장 지점입니다. RequestService.assignContractor(), QuoteService.submit(),
	// 견적·현장 방문·프로젝트 상태가 바뀌는 시점에 이 메서드로 알림을 생성합니다.
	// 예: notificationService.notify(contractor.getId(), NotificationType.REQUEST, "새 의뢰가 도착했습니다", ...)
	// ⭐ [버그 수정] 호출부가 사용자 입력값(견적 수정요청 메모 등)을 그대로 String.format에 끼워 넣는 경우가
	// 있어서, 합쳐진 문자열이 title/content 컬럼 길이(100/300자)를 넘으면 DataIntegrityViolationException으로
	// 알림 저장 자체가 실패해 원래 하려던 작업(예: 수정요청)까지 통째로 롤백되는 문제가 있었습니다. 이 진입점
	// 하나에서 안전하게 잘라내 모든 호출부를 한 번에 보호합니다.
	@Transactional
	public Long notify(Long receiverId, NotificationType type, String title, String content) {
		return notifyForRequest(receiverId, type, title, content, null, null);
	}

	@Transactional
	public Long notifyForRequest(Long receiverId, NotificationType type, String title, String content,
			Long requestId, Long contractorId) {
		Member receiver = memberRepository.findById(receiverId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + receiverId));

		Notification notification = Notification.builder().receiver(receiver).type(type)
				.title(truncate(title, TITLE_MAX_LENGTH)).content(truncate(content, CONTENT_MAX_LENGTH))
				.requestId(requestId).contractorId(contractorId).build();

		notificationRepository.save(notification);
		eventPublisher.publishEvent(RealtimeDomainEvent.notificationChanged(receiverId, notification.getId()));
		return notification.getId();
	}

	private String truncate(String value, int maxLength) {
		if (value == null || value.length() <= maxLength) {
			return value;
		}
		return value.substring(0, maxLength);
	}

	// ⭐ PDF "알림센터" 화면 목록 (로그인한 본인 알림, 최신순, 페이지네이션)
	public Page<NotificationResponse> getMyNotifications(Long receiverId, Pageable pageable) {
		return notificationRepository.findByReceiverIdOrderByCreatedAtDesc(receiverId, pageable)
				.map(NotificationResponse::new);
	}

	public long getUnreadCount(Long receiverId) {
		return notificationRepository.countByReceiverIdAndReadFalse(receiverId);
	}

	// ⭐ 본인 알림만 읽음 처리 가능
	@Transactional
	public void markAsRead(Long notificationId, Long receiverId) {
		Notification notification = findNotificationOrThrow(notificationId);
		if (!notification.getReceiver().getId().equals(receiverId)) {
			throw new ForbiddenAccessException("본인 알림만 읽음 처리할 수 있습니다.");
		}
		notification.markAsRead();
		eventPublisher.publishEvent(RealtimeDomainEvent.notificationChanged(receiverId, notificationId));
	}

	// ⭐ PDF "알림센터" 화면의 "모두 읽음" 버튼. 안 읽은 것만 조회해서 처리하므로 전체를 다 긁어오지 않습니다.
	@Transactional
	public void markAllAsRead(Long receiverId) {
		notificationRepository.findByReceiverIdAndReadFalse(receiverId).forEach(Notification::markAsRead);
		eventPublisher.publishEvent(RealtimeDomainEvent.notificationChanged(receiverId, null));
	}

	@Transactional
	public void markChatContextAsRead(Long receiverId, Long requestId, Long contractorId) {
		List<Notification> notifications = notificationRepository
				.findByReceiverIdAndRequestIdAndContractorIdAndTypeInAndReadFalse(receiverId, requestId,
						contractorId, List.of(NotificationType.CHAT, NotificationType.VISIT));
		if (notifications.isEmpty()) {
			return;
		}
		notifications.forEach(Notification::markAsRead);
		eventPublisher.publishEvent(RealtimeDomainEvent.notificationChanged(receiverId, null));
	}

	private Notification findNotificationOrThrow(Long notificationId) {
		return notificationRepository.findById(notificationId)
				.orElseThrow(() -> new NotificationNotFoundException("존재하지 않는 알림입니다: " + notificationId));
	}
}
