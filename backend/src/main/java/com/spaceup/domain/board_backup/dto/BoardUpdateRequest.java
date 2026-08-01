package com.spaceup.domain.board_backup.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class BoardUpdateRequest {
	@NotBlank(message = "제목은 필수 입력 사항입니다.")
	@Size(max = 100, message = "제목은 100자 이하로 입력해 주세요.")
	private String title;

	@NotBlank(message = "내용은 필수 입력 사항입니다.")
	private String content;
}