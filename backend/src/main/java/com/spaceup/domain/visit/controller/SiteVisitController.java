package com.spaceup.domain.visit.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.domain.visit.dto.SiteVisitChangeRequest;
import com.spaceup.domain.visit.dto.SiteVisitCompleteRequest;
import com.spaceup.domain.visit.dto.SiteVisitResponse;
import com.spaceup.domain.visit.dto.SiteVisitScheduleRequest;
import com.spaceup.domain.visit.service.SiteVisitService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "현장방문 예약" 화면
@RestController
@RequestMapping("/api/visits")
@RequiredArgsConstructor
public class SiteVisitController {

	private final SiteVisitService siteVisitService;

	@GetMapping("/request/{requestId}")
	public ResponseEntity<ApiResponse<SiteVisitResponse>> getByRequest(@PathVariable Long requestId,
			Authentication authentication) {
		return ResponseEntity.ok(
				ApiResponse.success("방문 일정 조회 완료", siteVisitService.getByRequest(requestId, getMemberId(authentication))));
	}

	@PostMapping("/request/{requestId}/register")
	public ResponseEntity<ApiResponse<SiteVisitResponse>> register(@PathVariable Long requestId,
			@Valid @RequestBody SiteVisitScheduleRequest request, Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("방문 일정이 등록되었습니다.", siteVisitService.register(requestId,
				getMemberId(authentication), request.getVisitDate(), request.getVisitTime(), request.getManagerName(),
				request.getNote())));
	}

	@PostMapping("/{visitId}/change-request")
	public ResponseEntity<ApiResponse<SiteVisitResponse>> requestChange(@PathVariable Long visitId,
			@Valid @RequestBody SiteVisitChangeRequest request, Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("방문 일정 변경을 요청했습니다.", siteVisitService.requestChange(visitId,
				getMemberId(authentication), request.getRequestedDate(), request.getRequestedTime(),
				request.getReason())));
	}

	@PostMapping("/{visitId}/accept-change")
	public ResponseEntity<ApiResponse<SiteVisitResponse>> acceptChange(@PathVariable Long visitId,
			Authentication authentication) {
		return ResponseEntity
				.ok(ApiResponse.success("변경 요청을 수락했습니다.", siteVisitService.acceptChange(visitId, getMemberId(authentication))));
	}

	@PostMapping("/{visitId}/propose")
	public ResponseEntity<ApiResponse<SiteVisitResponse>> propose(@PathVariable Long visitId,
			@Valid @RequestBody SiteVisitScheduleRequest request, Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("새 일정을 제안했습니다.", siteVisitService.propose(visitId,
				getMemberId(authentication), request.getVisitDate(), request.getVisitTime(), request.getNote())));
	}

	@PostMapping("/{visitId}/reject-change")
	public ResponseEntity<ApiResponse<SiteVisitResponse>> rejectChange(@PathVariable Long visitId,
			Authentication authentication) {
		return ResponseEntity
				.ok(ApiResponse.success("변경 요청을 거절했습니다.", siteVisitService.rejectChange(visitId, getMemberId(authentication))));
	}

	@PostMapping("/{visitId}/complete")
	public ResponseEntity<ApiResponse<SiteVisitResponse>> complete(@PathVariable Long visitId,
			@RequestBody(required = false) SiteVisitCompleteRequest request, Authentication authentication) {
		String note = request != null ? request.getNote() : null;
		return ResponseEntity
				.ok(ApiResponse.success("현장방문이 완료되었습니다.", siteVisitService.complete(visitId, getMemberId(authentication), note)));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
