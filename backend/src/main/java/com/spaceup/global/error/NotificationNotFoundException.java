package com.spaceup.global.error;

// ⭐ DB에 알림(Notification)이 존재하지 않을 때 터트릴 전용 에러입니다.
public class NotificationNotFoundException extends RuntimeException {
	public NotificationNotFoundException(String message) {
		super(message);
	}
}
