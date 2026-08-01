package com.spaceup.domain.contractor.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.contractor.dto.ContractorDashboardResponse;
import com.spaceup.domain.contractor.dto.ContractorProfileResponse;
import com.spaceup.domain.contractor.dto.ContractorProfileUpdateRequest;
import com.spaceup.domain.contractor.dto.ContractorServiceInfoUpdateRequest;
import com.spaceup.domain.contractor.dto.DisclosureSettingsUpdateRequest;
import com.spaceup.domain.contractor.dto.ManagerInfoUpdateRequest;
import com.spaceup.domain.contractor.service.ContractorProfileService;
import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

// ⭐ PDF "마이페이지/설정" 화면(시공사) - 사업자정보/활동지역/전문분야/포트폴리오 + 담당자정보/공개설정/대시보드
@RestController
@RequestMapping("/api/contractors")
@RequiredArgsConstructor
public class ContractorProfileController {

	private final ContractorProfileService contractorProfileService;

	@GetMapping("/me")
	public ResponseEntity<ApiResponse<ContractorProfileResponse>> getMyProfile(Authentication authentication) {
		Long memberId = getMemberId(authentication);
		return ResponseEntity.ok(ApiResponse.success("프로필 조회 완료", contractorProfileService.getOrCreate(memberId)));
	}

	// ⭐ [프론트 연동] "시공사 상세" 화면 - 임대인이 견적 요청 전/후 시공사 정보를 살펴볼 때 사용
	@GetMapping("/{contractorId}")
	public ResponseEntity<ApiResponse<ContractorProfileResponse>> getPublicProfile(@PathVariable Long contractorId) {
		return ResponseEntity
				.ok(ApiResponse.success("시공사 상세 조회 완료", contractorProfileService.getPublicProfile(contractorId)));
	}

	@PutMapping("/me")
	public ResponseEntity<ApiResponse<Void>> updateMyProfile(@Valid @RequestBody ContractorProfileUpdateRequest request,
			Authentication authentication) {
		Long memberId = getMemberId(authentication);
		contractorProfileService.updateProfile(memberId, request);
		return ResponseEntity.ok(ApiResponse.success("프로필이 저장되었습니다.", null));
	}

	// ⭐ [Figma 반영] "담당자 정보" 화면의 "담당자 정보 저장" 버튼
	@PutMapping("/me/manager")
	public ResponseEntity<ApiResponse<Void>> updateManagerInfo(@Valid @RequestBody ManagerInfoUpdateRequest request,
			Authentication authentication) {
		Long memberId = getMemberId(authentication);
		contractorProfileService.updateManagerInfo(memberId, request);
		return ResponseEntity.ok(ApiResponse.success("담당자 정보가 저장되었습니다.", null));
	}

	// ⭐ [Figma 반영] "업체 공개 설정" 화면의 "공개 설정 저장" 버튼
	@PutMapping("/me/disclosure")
	public ResponseEntity<ApiResponse<Void>> updateDisclosureSettings(
			@RequestBody DisclosureSettingsUpdateRequest request, Authentication authentication) {
		Long memberId = getMemberId(authentication);
		contractorProfileService.updateDisclosureSettings(memberId, request);
		return ResponseEntity.ok(ApiResponse.success("공개 설정이 저장되었습니다.", null));
	}

	// ⭐ [시공사 추천 점수] "예상 견적 적합도"/"일정 적합도" 계산용 견적 범위·가능일 저장
	@PutMapping("/me/service-info")
	public ResponseEntity<ApiResponse<Void>> updateServiceInfo(
			@Valid @RequestBody ContractorServiceInfoUpdateRequest request, Authentication authentication) {
		Long memberId = getMemberId(authentication);
		contractorProfileService.updateServiceInfo(memberId, request);
		return ResponseEntity.ok(ApiResponse.success("견적 범위/가능 일정이 저장되었습니다.", null));
	}

	// ⭐ [Figma 반영] "시공사 대시보드" 화면
	@GetMapping("/me/dashboard")
	public ResponseEntity<ApiResponse<ContractorDashboardResponse>> getDashboard(Authentication authentication) {
		Long memberId = getMemberId(authentication);
		return ResponseEntity.ok(ApiResponse.success("대시보드 조회 완료", contractorProfileService.getDashboard(memberId)));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
