package com.spaceup.domain.member.dto;

import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [Figma 반영] 마이페이지 - 계정설정의 "휴대폰 번호 변경" 폼
@Getter
@Setter
@NoArgsConstructor
public class PhoneUpdateRequest {

	@Pattern(regexp = "^01[0-9]-\\d{3,4}-\\d{4}$", message = "휴대폰 번호 형식이 올바르지 않습니다. 예: 010-1234-5678")
	private String phoneNumber;
}
