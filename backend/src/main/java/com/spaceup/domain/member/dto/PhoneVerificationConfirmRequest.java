package com.spaceup.domain.member.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PhoneVerificationConfirmRequest {

	@NotBlank(message = "인증코드를 입력해 주세요.")
	private String code;
}
