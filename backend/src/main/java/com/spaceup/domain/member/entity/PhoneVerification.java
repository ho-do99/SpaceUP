package com.spaceup.domain.member.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ [프론트 연동] 회원가입 "2단계 - 휴대폰 인증" 화면용. 이 시점엔 아직 Member 계정이 없어서
// Member.phoneVerificationCode(로그인 후 번호 변경용)와는 별개로, 전화번호를 키로 삼는 인증 기록을 둡니다.
@Entity
@Table(name = "phone_verification")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class PhoneVerification {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "phone_number", nullable = false, length = 20)
	private String phoneNumber;

	@Column(nullable = false, length = 10)
	private String code;

	@Column(name = "expires_at", nullable = false)
	private LocalDateTime expiresAt;

	@Builder.Default
	@Column(nullable = false)
	private boolean verified = false;

	public boolean verify(String inputCode) {
		if (expiresAt.isBefore(LocalDateTime.now())) {
			return false;
		}
		if (!code.equals(inputCode)) {
			return false;
		}
		this.verified = true;
		return true;
	}
}
