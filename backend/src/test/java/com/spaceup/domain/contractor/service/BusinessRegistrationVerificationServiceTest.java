package com.spaceup.domain.contractor.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.spaceup.domain.contractor.dto.BusinessRegistrationVerifyResponse;

class BusinessRegistrationVerificationServiceTest {

	private final BusinessRegistrationVerificationService service = new BusinessRegistrationVerificationService();

	@Test
	void validChecksumPasses() {
		// 220-81-62517: 공개적으로 자주 인용되는 유효 체크섬 사업자등록번호 예시
		BusinessRegistrationVerifyResponse response = service.verify("220-81-62517");
		assertThat(response.valid()).isTrue();
	}

	@Test
	void wrongCheckDigitFails() {
		BusinessRegistrationVerifyResponse response = service.verify("220-81-62518");
		assertThat(response.valid()).isFalse();
	}

	@Test
	void wrongLengthFails() {
		BusinessRegistrationVerifyResponse response = service.verify("123-45-678");
		assertThat(response.valid()).isFalse();
	}
}
