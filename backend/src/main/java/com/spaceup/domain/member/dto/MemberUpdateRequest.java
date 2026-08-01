package com.spaceup.domain.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class MemberUpdateRequest {
	@NotBlank(message = "이메일은 필수 입력 사항입니다.")
	@Email(message = "올바른 이메일 형식이 아닙니다.")
	private String email;

	@NotBlank(message = "이름은 필수 입력 사항입니다.")
	@Size(max = 20, message = "이름은 20자 이하로 입력해 주세요.")
	private String name;
}