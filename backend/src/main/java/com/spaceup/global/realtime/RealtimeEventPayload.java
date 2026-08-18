package com.spaceup.global.realtime;

public record RealtimeEventPayload(
		String type,
		Long notificationId,
		Long requestId,
		Long contractorId,
		Long messageId) {

	public RealtimeEventPayload(RealtimeDomainEvent event) {
		this(event.type(), event.notificationId(), event.requestId(), event.contractorId(), event.messageId());
	}
}
