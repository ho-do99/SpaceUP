package com.spaceup.domain.quote.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ContractorQuoteItemRequest {

	@NotBlank(message = "견적 항목 분류는 필수 입력 사항입니다.")
	private String category;

	private String description;

	@NotNull(message = "항목 금액은 필수 입력 사항입니다.")
	private Long amount;
}
