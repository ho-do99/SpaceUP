package com.spaceup.domain.admin.controller;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.admin.dto.AdminDashboardResponse;
import com.spaceup.domain.admin.dto.MemberRevisionRequest;
import com.spaceup.domain.admin.dto.SystemSettingResponse;
import com.spaceup.domain.admin.dto.SystemSettingUpdateRequest;
import com.spaceup.domain.admin.service.AdminService;
import com.spaceup.domain.member.dto.MemberResponse;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

// ⭐ PDF "관리자" 전 화면. SecurityConfig에 "/api/admin/**" → hasRole("ADMIN") 매핑을 추가해야
// 실제로 관리자만 호출 가능합니다 (global/config/SecurityConfig.java 하단 주석 참고).
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

	private final AdminService adminService;

	// ⭐ PDF "전체 운영 현황" 대시보드
	@GetMapping("/dashboard")
	public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboard() {
		return ResponseEntity.ok(ApiResponse.success("대시보드 조회 완료", adminService.getDashboard()));
	}

	// ⭐ PDF "회원관리" 화면 (role 미지정 시 전체 조회, 페이지네이션)
	@GetMapping("/members")
	public ResponseEntity<ApiResponse<Page<MemberResponse>>> getMembers(
			@RequestParam(required = false) MemberRole role, @PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(ApiResponse.success("회원 목록 조회 완료", adminService.getMembers(role, pageable)));
	}

	// ⭐ PDF "시공사관리 / 자재업체관리" 화면의 승인 대기 목록 (PENDING + NEEDS_REVISION)
	@GetMapping("/members/pending")
	public ResponseEntity<ApiResponse<List<MemberResponse>>> getPendingApprovals(@RequestParam MemberRole role) {
		return ResponseEntity.ok(ApiResponse.success("승인 대기 목록 조회 완료", adminService.getPendingApprovals(role)));
	}

	// ⭐ PDF "시공사관리 / 자재업체관리" 화면의 "승인" 버튼
	@PostMapping("/members/{memberId}/approve")
	public ResponseEntity<ApiResponse<Void>> approveMember(@PathVariable Long memberId) {
		adminService.approveMember(memberId);
		return ResponseEntity.ok(ApiResponse.success("회원을 승인했습니다.", null));
	}

	// ⭐ [Figma 반영] PDF "보완 요청" 화면 - 심사 담당자가 보완 사유 + 재제출 기한을 남깁니다.
	@PostMapping("/members/{memberId}/request-revision")
	public ResponseEntity<ApiResponse<Void>> requestRevision(@PathVariable Long memberId,
			@Valid @RequestBody MemberRevisionRequest request) {
		adminService.requestRevision(memberId, request.getMessage(), request.getDeadline());
		return ResponseEntity.ok(ApiResponse.success("보완을 요청했습니다.", null));
	}

	// ⭐ PDF "시스템설정" 화면 조회 (예: /api/admin/settings/COMMISSION_RATE)
	@GetMapping("/settings/{key}")
	public ResponseEntity<ApiResponse<SystemSettingResponse>> getSetting(@PathVariable String key) {
		return ResponseEntity.ok(ApiResponse.success("설정 조회 완료", adminService.getSetting(key)));
	}

	// ⭐ PDF "시스템설정" 화면 변경 (없으면 새로 생성)
	@PutMapping("/settings/{key}")
	public ResponseEntity<ApiResponse<Void>> updateSetting(@PathVariable String key,
			@Valid @RequestBody SystemSettingUpdateRequest request) {
		adminService.updateSetting(key, request.getSettingValue(), null);
		return ResponseEntity.ok(ApiResponse.success("설정이 저장되었습니다.", null));
	}
}
