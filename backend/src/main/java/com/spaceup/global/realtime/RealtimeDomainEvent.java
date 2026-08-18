package com.spaceup.global.realtime;

public record RealtimeDomainEvent(
		Long memberId,
		String type,
		Long notificationId,
		Long requestId,
		Long contractorId,
		Long messageId) {

	public static RealtimeDomainEvent notificationChanged(Long memberId, Long notificationId) {
		return new RealtimeDomainEvent(memberId, "NOTIFICATION_CHANGED", notificationId, null, null, null);
	}

	public static RealtimeDomainEvent chatMessage(Long memberId, Long requestId, Long contractorId, Long messageId) {
		return new RealtimeDomainEvent(memberId, "CHAT_MESSAGE", null, requestId, contractorId, messageId);
	}
}
