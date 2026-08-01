package com.spaceup.global.error;

// ⭐ DB에 정산(Settlement) 내역이 존재하지 않을 때 터트릴 전용 에러입니다.
public class SettlementNotFoundException extends RuntimeException {
	public SettlementNotFoundException(String message) {
		super(message);
	}
}
