package com.spaceup.global.realtime;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
public class RealtimeEmitterRegistry {

	private static final long EMITTER_TIMEOUT_MILLIS = 300_000L;
	private final Map<Long, Set<SseEmitter>> emittersByMember = new ConcurrentHashMap<>();

	public SseEmitter connect(Long memberId) {
		SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MILLIS);
		emittersByMember.computeIfAbsent(memberId, ignored -> ConcurrentHashMap.newKeySet()).add(emitter);
		Runnable cleanup = () -> remove(memberId, emitter);
		emitter.onCompletion(cleanup);
		emitter.onTimeout(cleanup);
		emitter.onError(ignored -> cleanup.run());

		try {
			emitter.send(SseEmitter.event().name("realtime").reconnectTime(2_000L)
					.data(new RealtimeEventPayload("CONNECTED", null, null, null, null)));
		} catch (IOException exception) {
			remove(memberId, emitter);
			emitter.completeWithError(exception);
		}
		return emitter;
	}

	public void send(Long memberId, RealtimeEventPayload payload) {
		Set<SseEmitter> emitters = emittersByMember.get(memberId);
		if (emitters == null) return;
		emitters.forEach(emitter -> send(memberId, emitter, payload));
	}

	@Scheduled(fixedRate = 25_000L)
	public void heartbeat() {
		RealtimeEventPayload heartbeat = new RealtimeEventPayload("HEARTBEAT", null, null, null, null);
		emittersByMember.forEach((memberId, emitters) ->
				emitters.forEach(emitter -> send(memberId, emitter, heartbeat)));
	}

	private void send(Long memberId, SseEmitter emitter, RealtimeEventPayload payload) {
		try {
			emitter.send(SseEmitter.event().name("realtime").id(Instant.now().toString()).data(payload));
		} catch (IOException | IllegalStateException exception) {
			remove(memberId, emitter);
			emitter.complete();
		}
	}

	private void remove(Long memberId, SseEmitter emitter) {
		Set<SseEmitter> emitters = emittersByMember.get(memberId);
		if (emitters == null) return;
		emitters.remove(emitter);
		if (emitters.isEmpty()) emittersByMember.remove(memberId, emitters);
	}
}
