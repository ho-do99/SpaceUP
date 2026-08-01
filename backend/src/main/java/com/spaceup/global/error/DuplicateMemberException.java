package com.spaceup.global.error;

// ⭐ 아이디 중복 가입 시 터트릴 나만의 전용 에러 파일입니다.
public class DuplicateMemberException extends RuntimeException {
	public DuplicateMemberException(String message) {
		super(message); // 부모 예외 상자에 에러 메시지 전달
	}
}
