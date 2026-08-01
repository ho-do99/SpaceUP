package com.spaceup.domain.board_backup.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class BoardCommentRequest {
	// ⭐ [최종 검토 반영] memberId 필드를 제거했습니다. (BoardWriteRequest와 동일한 사칭 취약점 수정)
	// 작성자는 CommentController에서 Authentication(JWT)으로부터 가져옵니다.

	@NotNull(message = "게시글 번호는 필수입니다.")
	private Long boardId;

	@NotBlank(message = "댓글 내용은 필수 입력 사항입니다.")
	private String content;
}
