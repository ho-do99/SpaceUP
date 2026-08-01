package com.spaceup.domain.quote.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ PDF "견적 작성" 화면 (기본/공사/자재/비용 탭)을 하나의 요청으로 통합
@Getter
@Setter
@NoArgsConstructor
public class ContractorQuoteCreateRequest {

	@NotNull(message = "의뢰 번호는 필수입니다.")
	private Long requestId;

	private String title;
	private String startDate;
	private Integer durationDays;
	private Long materialCost;
	private Long laborCost;
	private Long vat;
	private Long discount;
	private String detailContent;

	@NotEmpty(message = "견적 항목을 1개 이상 입력해 주세요.")
	@Valid
	private List<ContractorQuoteItemRequest> items;
}
