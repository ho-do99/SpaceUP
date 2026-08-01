package com.spaceup.domain.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PhoneVerificationPublicConfirmRequest {

	@NotBlank(message = "휴대폰 번호는 필수 입력 사항입니다.")
	@Pattern(regexp = "^01[0-9]-\\d{3,4}-\\d{4}$", message = "휴대폰 번호 형식이 올바르지 않습니다. 예: 010-1234-5678")
	private String phoneNumber;

	@NotBlank(message = "인증코드를 입력해 주세요.")
	private String code;
}
