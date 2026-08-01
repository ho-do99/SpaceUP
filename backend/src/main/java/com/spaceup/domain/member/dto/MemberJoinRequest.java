package com.spaceup.domain.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.spaceup.domain.member.entity.MemberRole;

@Getter
@Setter
@NoArgsConstructor
public class MemberJoinRequest {

	// ⭐ PDF 로그인/회원가입 화면의 "로그인 유형" 선택값. ADMIN은 이 API로 가입시키지 않고 별도 관리자 등록 절차로 뺍니다.
	@NotNull(message = "회원 유형(임대인/시공사/자재업체)을 선택해 주세요.")
	private MemberRole role;

	@NotBlank(message = "아이디는 필수 입력 사항입니다.")
	@Size(min = 4, max = 20, message = "아이디는 4자 이상 20자 이하로 입력해 주세요.")
	private String username;

	@NotBlank(message = "비밀번호는 필수 입력 사항입니다.")
	@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[$@$!%*#?&])[A-Za-z\\d$@$!%*#?&]{8,16}$", message = "비밀번호는 8자 이상 16자 이하의 영문, 숫자, 특수문자를 조합해야 합니다.")
	private String password;

	@NotBlank(message = "이메일은 필수 입력 사항입니다.")
	@Email(message = "올바른 이메일 형식이 아닙니다.")
	private String email;

	@NotBlank(message = "이름은 필수 입력 사항입니다.")
	@Size(max = 20, message = "이름은 20자 이하로 입력해 주세요.")
	private String name;

	// ⭐ [Figma 반영] 회원가입 1단계(계정) 화면에 이미 휴대폰 번호 입력칸이 있고, 2단계에서 이 번호로 인증합니다.
	@NotBlank(message = "휴대폰 번호는 필수 입력 사항입니다.")
	@Pattern(regexp = "^01[0-9]-\\d{3,4}-\\d{4}$", message = "휴대폰 번호 형식이 올바르지 않습니다. 예: 010-1234-5678")
	private String phoneNumber;
}
