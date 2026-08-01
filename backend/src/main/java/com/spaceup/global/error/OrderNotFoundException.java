package com.spaceup.global.error;

// ⭐ DB에 자재 주문(MaterialOrder)이 존재하지 않을 때 터트릴 전용 에러입니다.
public class OrderNotFoundException extends RuntimeException {
	public OrderNotFoundException(String message) {
		super(message);
	}
}
