package com.spaceup.domain.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class InteriorImageGenerateRequest {

	@NotBlank(message = "원하는 스타일/분위기 설명은 필수입니다.")
	private String style; // 예: "화이트톤 모던 스타일로 바꿔줘"

	// ⭐ 이미 업로드된 집 사진(POST /api/files/images 또는 /api/requests/{id}/images로 등록된 URL)을
	// 참고 이미지로 넘기면 그 사진을 기반으로 리모델링 결과를 생성합니다. 미입력 시 텍스트 설명만으로 생성합니다.
	private String referenceImageUrl;
}
