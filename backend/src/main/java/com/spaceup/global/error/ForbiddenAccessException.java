package com.spaceup.global.error;

// ⭐ 로그인은 했지만 본인 소유가 아닌 리소스(견적/상품/주문/일정 등)를 조작하려 할 때 사용합니다.
public class ForbiddenAccessException extends RuntimeException {
	public ForbiddenAccessException(String message) {
		super(message);
	}
}
