package com.spaceup.domain.contractor.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spaceup.domain.contractor.dto.BusinessRegistrationVerifyRequest;
import com.spaceup.domain.contractor.dto.BusinessRegistrationVerifyResponse;
import com.spaceup.domain.contractor.service.BusinessRegistrationVerificationService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] 시공사 회원가입 화면의 "사업자등록번호 확인" 버튼. 계정이 아직 없는 시점(JWT 없이 호출)이라
// 공개 API입니다. 목업이라 실제 국세청 등록 여부가 아니라 체크섬 기반 형식 검증만 합니다.
@RestController
@RequestMapping("/api/contractors/business-registration")
@RequiredArgsConstructor
public class BusinessRegistrationController {

	private final BusinessRegistrationVerificationService businessRegistrationVerificationService;

	@PostMapping("/verify")
	public ResponseEntity<ApiResponse<BusinessRegistrationVerifyResponse>> verify(
			@Valid @RequestBody BusinessRegistrationVerifyRequest request) {
		BusinessRegistrationVerifyResponse response = businessRegistrationVerificationService
				.verify(request.getBusinessRegistrationNumber());
		String message = response.valid() ? "사업자등록번호 확인이 완료되었습니다." : "사업자등록번호를 다시 확인해 주세요.";
		return ResponseEntity.ok(ApiResponse.success(message, response));
	}
}
