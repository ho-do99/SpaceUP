package com.spaceup.domain.project.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ PDF "계약 전환" 버튼 - 수락된 견적을 실제 공사 프로젝트로 전환
@Getter
@Setter
@NoArgsConstructor
public class ProjectConvertRequest {

	@NotNull(message = "견적 번호는 필수입니다.")
	private Long quoteId;

	private String constructionItems; // 콤마 구분, 미입력 시 견적 항목의 category를 합쳐서 자동 생성
}
