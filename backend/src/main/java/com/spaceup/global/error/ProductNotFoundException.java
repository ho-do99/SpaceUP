package com.spaceup.global.error;

// ⭐ DB에 자재 상품(Product)이 존재하지 않을 때 터트릴 전용 에러입니다.
public class ProductNotFoundException extends RuntimeException {
	public ProductNotFoundException(String message) {
		super(message);
	}
}
