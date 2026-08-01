package com.spaceup.domain.product.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ PDF "재고 관리" 화면의 "재고 조정" 버튼. delta는 증감치(입고면 +, 출고/조정이면 -)
@Getter
@Setter
@NoArgsConstructor
public class StockAdjustRequest {

	@NotNull(message = "조정 수량은 필수 입력 사항입니다.")
	private Integer delta;
}
