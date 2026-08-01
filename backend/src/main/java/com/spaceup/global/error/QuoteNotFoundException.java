package com.spaceup.global.error;

// ⭐ DB에 견적(Quote)이 존재하지 않을 때 터트릴 전용 에러입니다.
public class QuoteNotFoundException extends RuntimeException {
	public QuoteNotFoundException(String message) {
		super(message);
	}
}
