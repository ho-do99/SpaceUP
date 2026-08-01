package com.spaceup.domain.board_backup.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class BoardCommentUpdateRequest {
	@NotBlank(message = "댓글 내용은 필수 입력 사항입니다.")
	private String content;
}