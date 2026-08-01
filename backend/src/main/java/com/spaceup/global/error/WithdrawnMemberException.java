package com.spaceup.global.error;

// ⭐ 이미 탈퇴 처리된 회원이 로그인을 시도할 때 터트릴 전용 에러 파일입니다.
public class WithdrawnMemberException extends RuntimeException {
	public WithdrawnMemberException(String message) {
		super(message);
	}
}