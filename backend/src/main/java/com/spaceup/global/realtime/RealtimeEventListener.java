package com.spaceup.global.realtime;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RealtimeEventListener {

	private final RealtimeEmitterRegistry emitterRegistry;

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
	public void onRealtimeEvent(RealtimeDomainEvent event) {
		emitterRegistry.send(event.memberId(), new RealtimeEventPayload(event));
	}
}
