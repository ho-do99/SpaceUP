package com.spaceup.global.error;

// ⭐ DB에 회원이 존재하지 않을 때 터트릴 전용 에러 파일입니다.
public class MemberNotFoundException extends RuntimeException {
	public MemberNotFoundException(String message) {
		super(message);
	}
}
