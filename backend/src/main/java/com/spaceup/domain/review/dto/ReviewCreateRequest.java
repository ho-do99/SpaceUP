package com.spaceup.domain.review.dto;

import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.spaceup.domain.review.entity.ReviewKeyword;

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

	// ⭐ [보안 수정] 원래 List<String>이라 아무 문자열이나(콤마 포함 값까지) 그대로 저장돼서, 저장 시
	// String.join(",")/조회 시 split(",")를 거치며 콤마가 든 값이 여러 개의 가짜 키워드로 깨지는 문제가
	// 있었습니다. enum 타입으로 받으면 Jackson이 4종 고정값 외에는 역직렬화 단계에서 바로 거부합니다.
	private List<ReviewKeyword> keywords;
}
