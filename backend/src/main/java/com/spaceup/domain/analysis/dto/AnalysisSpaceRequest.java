package com.spaceup.domain.analysis.dto;

import jakarta.validation.constraints.NotBlank;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [프론트 연동] PUT /api/analysis/request/{requestId}/spaces - 화면에서 편집한 공간 목록 전체를
// 한 번에 저장합니다(부분 수정이 아니라 전체 교체). 목록 순서가 곧 sortOrder가 됩니다.
@Getter
@Setter
@NoArgsConstructor
public class AnalysisSpaceRequest {

	@NotBlank(message = "공간 이름은 필수 입력 사항입니다.")
	private String spaceName;

	private Double spaceAreaM2;
	private Double floorAreaM2;
	private Double wallpaperAreaM2;
	private boolean selectedForConstruction = true;
}
