package com.spaceup.domain.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Future;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [Figma 반영] "보완 요청" 화면 - 관리자가 사유와 재제출 기한을 입력해 회원에게 보완을 요청
@Getter
@Setter
@NoArgsConstructor
public class MemberRevisionRequest {

	@NotBlank(message = "보완 요청 사유는 필수입니다.")
	private String message;

	@NotNull(message = "재제출 기한은 필수입니다.")
	@Future(message = "재제출 기한은 미래 시각이어야 합니다.")
	private LocalDateTime deadline;
}
