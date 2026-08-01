package com.spaceup.global.error;

// ⭐ [Figma 반영] 포트폴리오 조회/수정/삭제 시 대상이 없을 때 사용하는 전용 예외입니다.
public class PortfolioNotFoundException extends RuntimeException {
	public PortfolioNotFoundException(String message) {
		super(message);
	}
}
