package com.spaceup.global.error;

// ⭐ DB에 일정(ScheduleEvent)이 존재하지 않을 때 터트릴 전용 에러입니다.
public class ScheduleNotFoundException extends RuntimeException {
	public ScheduleNotFoundException(String message) {
		super(message);
	}
}
