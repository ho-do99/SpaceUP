package com.spaceup.domain.contractor.service;

import org.springframework.stereotype.Service;

import com.spaceup.domain.contractor.dto.BusinessRegistrationVerifyResponse;

// ⭐ [목업] 국세청 "사업자등록정보 진위확인" API 연동 전까지 쓰는 목업입니다. 실제 국세청 API는 사업자등록번호 +
// 대표자성명 + 개업일자를 보내 "실제로 등록된 사업자와 일치하는지"까지 확인하지만, 여기서는 그 대신 사업자등록번호
// 자체에 내장된 체크섬(검증용 10번째 자리 숫자)만 계산해서 "형식상 유효한 번호인지"만 확인합니다.
// TODO: 실제 연동 시 data.go.kr의 국세청 사업자등록정보 진위확인 API(서비스키 발급 필요)로 교체하고,
// 대표자성명/개업일자를 추가로 받아 실제 등록 여부까지 검증하세요.
@Service
public class BusinessRegistrationVerificationService {

	private static final int[] CHECKSUM_WEIGHTS = { 1, 3, 7, 1, 3, 7, 1, 3, 5 };

	public BusinessRegistrationVerifyResponse verify(String businessRegistrationNumber) {
		String digits = businessRegistrationNumber == null ? "" : businessRegistrationNumber.replaceAll("[^0-9]", "");
		if (digits.length() != 10) {
			return new BusinessRegistrationVerifyResponse(false, businessRegistrationNumber,
					"사업자등록번호는 숫자 10자리(하이픈 제외)여야 합니다.");
		}
		boolean valid = hasValidChecksum(digits);
		String message = valid ? "형식상 유효한 사업자등록번호입니다. (목업 - 실제 국세청 등록 여부는 확인하지 않았습니다)"
				: "사업자등록번호 형식이 올바르지 않습니다.";
		return new BusinessRegistrationVerifyResponse(valid, businessRegistrationNumber, message);
	}

	// ⭐ 사업자등록번호 10번째 자리는 앞 9자리로 계산되는 검증용 숫자입니다(국세청 공개 알고리즘).
	private boolean hasValidChecksum(String digits) {
		int sum = 0;
		for (int i = 0; i < 9; i++) {
			sum += (digits.charAt(i) - '0') * CHECKSUM_WEIGHTS[i];
		}
		sum += ((digits.charAt(8) - '0') * 5) / 10;
		int checkDigit = (10 - (sum % 10)) % 10;
		return checkDigit == (digits.charAt(9) - '0');
	}
}
