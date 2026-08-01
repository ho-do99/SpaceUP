package com.spaceup.domain.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [Figma 반영] "포트폴리오 등록/수정" 화면 입력값 그대로 매핑
@Getter
@Setter
@NoArgsConstructor
public class PortfolioCreateRequest {

	@NotBlank(message = "프로젝트명은 필수 입력 사항입니다.")
	private String projectName;

	private String region;
	private String propertyType;

	@Positive(message = "면적은 0보다 커야 합니다.")
	private Double areaM2;

	private String workItems; // "바닥,도배,조명"
	private Integer durationDays;
	private Long amount;
	private String mainImageUrl;
	private String photoUrls; // "url1,url2,url3"
}
