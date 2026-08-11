package com.spaceup.global.error;

// ⭐ 비밀번호 변경 시 현재 비밀번호가 일치하지 않을 때 사용합니다.
public class InvalidPasswordException extends RuntimeException {
	public InvalidPasswordException(String message) {
		super(message);
	}
}
