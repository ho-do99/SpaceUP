package com.spaceup.domain.member.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.member.entity.PhoneVerification;
import com.spaceup.domain.member.repository.PhoneVerificationRepository;
import com.spaceup.global.error.InvalidVerificationCodeException;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] 회원가입 "휴대폰 인증" 단계는 계정이 아직 없는 상태에서 호출돼야 하므로(JWT 없이),
// 로그인 후 번호 변경에 쓰는 MemberService의 인증코드 로직과 분리해 전화번호를 키로 관리합니다.
// 실제 SMS 발송은 아직 미연동이라 목업으로 코드값을 응답에 그대로 실어 보냅니다 (MemberService와 동일한 패턴).
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PhoneVerificationService {

	private static final int VERIFICATION_CODE_TTL_MINUTES = 5;

	private final PhoneVerificationRepository phoneVerificationRepository;
	private final SecureRandom secureRandom = new SecureRandom();

	@Transactional
	public String sendCode(String phoneNumber) {
		String code = String.format("%06d", secureRandom.nextInt(1_000_000));
		PhoneVerification verification = PhoneVerification.builder().phoneNumber(phoneNumber).code(code)
				.expiresAt(LocalDateTime.now().plusMinutes(VERIFICATION_CODE_TTL_MINUTES)).build();
		phoneVerificationRepository.save(verification);
		return code;
	}

	@Transactional
	public void confirmCode(String phoneNumber, String code) {
		PhoneVerification verification = phoneVerificationRepository.findTopByPhoneNumberOrderByIdDesc(phoneNumber)
				.orElseThrow(() -> new InvalidVerificationCodeException("먼저 인증코드를 발급받아 주세요."));
		if (!verification.verify(code)) {
			throw new InvalidVerificationCodeException("인증코드가 올바르지 않거나 만료되었습니다.");
		}
	}

	// ⭐ 회원가입 직전 검증용 - 해당 번호로 방금 인증을 마쳤는지 확인합니다 (MemberService.join 참고).
	public boolean isVerified(String phoneNumber) {
		return phoneVerificationRepository.findTopByPhoneNumberOrderByIdDesc(phoneNumber)
				.map(PhoneVerification::isVerified).orElse(false);
	}
}
