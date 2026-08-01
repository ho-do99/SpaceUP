package com.spaceup.global.error;

// ⭐ [최종 검토 반영] 재고보다 많은 수량을 차감(주문/재고조정)하려 할 때 막기 위한 전용 예외입니다.
// 기존에는 Product.updateStock()이 음수 재고를 그대로 허용해 오버셀(초과 판매)이 가능했습니다.
public class InsufficientStockException extends RuntimeException {
	public InsufficientStockException(String message) {
		super(message);
	}
}
