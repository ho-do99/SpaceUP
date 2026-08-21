package com.spaceup.domain.quote.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ContractorQuoteItemRequest {

	@NotBlank(message = "견적 항목 분류는 필수 입력 사항입니다.")
	private String category;

	@Size(max = 500, message = "견적 항목 설명은 500자 이하여야 합니다.")
	private String description;

	@DecimalMin(value = "0.0", inclusive = false, message = "수량은 0보다 커야 합니다.")
	private BigDecimal quantity;

	@Size(max = 10, message = "측정 단위는 10자 이하여야 합니다.")
	private String measurementUnit;

	@PositiveOrZero(message = "단가는 0 이상이어야 합니다.")
	private Long unitPrice;

	@NotNull(message = "항목 금액은 필수 입력 사항입니다.")
	@PositiveOrZero(message = "항목 금액은 0 이상이어야 합니다.")
	private Long amount;
}
