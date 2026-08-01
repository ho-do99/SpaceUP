package com.spaceup.domain.order.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ PDF "주문/발주 관리" 화면 - 시공사가 자재업체 상품을 주문할 때 사용
@Getter
@Setter
@NoArgsConstructor
public class OrderCreateRequest {

	@NotNull(message = "상품 번호는 필수입니다.")
	private Long productId;

	@NotNull(message = "주문 수량은 필수입니다.")
	@Positive(message = "주문 수량은 0보다 커야 합니다.")
	private Integer quantity;
}
