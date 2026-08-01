package com.spaceup.global.error;

// ⭐ DB에 의뢰(Request)가 존재하지 않을 때 터트릴 전용 에러입니다.
public class RequestNotFoundException extends RuntimeException {
	public RequestNotFoundException(String message) {
		super(message);
	}
}
