package com.spaceup.domain.quote.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [Figma 반영] "보낸 견적 상세 - 수정 요청" 화면 - 임대인이 남기는 수정 요청 메모
@Getter
@Setter
@NoArgsConstructor
public class ContractorQuoteRevisionRequest {

	@NotBlank(message = "수정 요청 내용을 입력해 주세요.")
	private String note;
}
