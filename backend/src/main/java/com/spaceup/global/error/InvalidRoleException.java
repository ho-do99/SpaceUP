package com.spaceup.global.error;

// ⭐ CONTRACTOR가 아닌 role의 회원이 시공사 전용 API(프로필 등)를 호출할 때 사용합니다.
public class InvalidRoleException extends RuntimeException {
	public InvalidRoleException(String message) {
		super(message);
	}
}
