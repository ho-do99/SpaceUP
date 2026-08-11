package com.spaceup.domain.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PasswordUpdateRequest {

	@NotBlank(message = "현재 비밀번호를 입력해 주세요.")
	private String currentPassword;

	@NotBlank(message = "새 비밀번호는 필수 입력 사항입니다.")
	@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[$@$!%*#?&])[A-Za-z\\d$@$!%*#?&]{8,16}$", message = "비밀번호는 8자 이상 16자 이하의 영문, 숫자, 특수문자를 조합해야 합니다.")
	private String newPassword;
}
