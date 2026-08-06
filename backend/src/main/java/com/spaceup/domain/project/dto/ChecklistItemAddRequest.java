package com.spaceup.domain.project.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ChecklistItemAddRequest {

	@NotBlank(message = "체크리스트 항목 내용은 필수입니다.")
	private String label;
}
