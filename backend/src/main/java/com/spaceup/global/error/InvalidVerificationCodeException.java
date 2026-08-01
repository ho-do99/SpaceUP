package com.spaceup.global.error;

// ⭐ [목업 OTP] 휴대폰 인증코드가 틀렸거나 만료됐을 때 사용합니다.
public class InvalidVerificationCodeException extends RuntimeException {
	public InvalidVerificationCodeException(String message) {
		super(message);
	}
}
