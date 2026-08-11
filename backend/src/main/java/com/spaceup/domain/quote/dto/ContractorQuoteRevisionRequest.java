package com.spaceup.domain.quote.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [Figma 반영] "보낸 견적 상세 - 수정 요청" 화면 - 임대인이 남기는 수정 요청.
// targetItemIds/requestedAmount는 항목별로 구조화해서 요청하고 싶을 때만 채우는 선택 항목(둘 다 생략 가능).
@Getter
@Setter
@NoArgsConstructor
public class ContractorQuoteRevisionRequest {

	@NotBlank(message = "수정 요청 내용을 입력해 주세요.")
	private String note;

	// 수정이 필요한 견적 항목(ContractorQuoteItem.id) 목록. 특정 항목이 아니라 견적 전체에 대한 요청이면 생략.
	private List<Long> targetItemIds;

	// 임대인이 희망하는 조정 금액(원). 특정 금액을 요구하지 않으면 생략.
	private Long requestedAmount;
}
