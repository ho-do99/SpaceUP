package com.spaceup.global.realtime;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RealtimeEventListenerTest {

	@Mock RealtimeEmitterRegistry emitterRegistry;
	@InjectMocks RealtimeEventListener listener;

	@Test
	void routesOnlyTheAuthenticatedMembersEventPayload() {
		listener.onRealtimeEvent(RealtimeDomainEvent.chatMessage(10L, 20L, 30L, 40L));

		verify(emitterRegistry).send(org.mockito.ArgumentMatchers.eq(10L), argThat(payload ->
				payload.type().equals("CHAT_MESSAGE")
						&& payload.requestId().equals(20L)
						&& payload.contractorId().equals(30L)
						&& payload.messageId().equals(40L)));
	}
}
