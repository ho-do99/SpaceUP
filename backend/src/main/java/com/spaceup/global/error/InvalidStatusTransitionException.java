package com.spaceup.global.error;

// ⭐ 의뢰/견적 등의 상태를 잘못된 순서로 바꾸려는 시도를 막을 때 사용하는 공용 예외입니다.
// 예: 이미 REJECTED된 의뢰를 다시 승인하려는 경우.
public class InvalidStatusTransitionException extends RuntimeException {
	public InvalidStatusTransitionException(String message) {
		super(message);
	}
}
