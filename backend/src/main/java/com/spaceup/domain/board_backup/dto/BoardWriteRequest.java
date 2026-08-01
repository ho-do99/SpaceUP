package com.spaceup.domain.board_backup.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class BoardWriteRequest {
	// ⭐ [최종 검토 반영] memberId 필드를 제거했습니다. 기존에는 클라이언트가 보낸 이 값을 그대로
	// 작성자로 사용해서, 로그인한 누구나 다른 회원 ID를 넣어 그 사람 명의로 글을 쓸 수 있는
	// 사칭(impersonation) 취약점이 있었습니다. 이제 작성자는 BoardController에서
	// Authentication(JWT)으로부터 가져옵니다.

	@NotBlank(message = "제목은 필수 입력 사항입니다.")
	@Size(max = 100, message = "제목은 100자 이하로 입력해 주세요.")
	private String title;

	@NotBlank(message = "내용은 필수 입력 사항입니다.")
	private String content;

	@NotBlank(message = "게시판 종류는 필수입니다.")
	private String boardType;
}
