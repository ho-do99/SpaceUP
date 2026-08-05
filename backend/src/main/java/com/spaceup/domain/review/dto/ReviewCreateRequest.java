package com.spaceup.domain.review.dto;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReviewCreateRequest {

	@NotNull(message = "평점은 필수입니다.")
	@Min(value = 1, message = "평점은 1~5 사이여야 합니다.")
	@Max(value = 5, message = "평점은 1~5 사이여야 합니다.")
	private Integer rating;

	@NotBlank(message = "리뷰 내용은 필수입니다.")
	private String content;

	// ⭐ ContractorReviewKeyword 4종 중 선택 (미선택 가능)
	private List<String> keywords;
}
