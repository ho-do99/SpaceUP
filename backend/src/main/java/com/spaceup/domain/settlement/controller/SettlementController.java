package com.spaceup.domain.settlement.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.domain.settlement.dto.SettlementCreateRequest;
import com.spaceup.domain.settlement.dto.SettlementResponse;
import com.spaceup.domain.settlement.service.SettlementService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/settlements")
@RequiredArgsConstructor
public class SettlementController {

	private final SettlementService settlementService;

	// ⭐ PDF "정산/수수료 관리" - 관리자가 정산 레코드를 생성 (추후 자동화 지점: 견적/주문 완료 이벤트에서 내부 호출로 대체)
	@PostMapping
	public ResponseEntity<ApiResponse<Long>> createSettlement(@Valid @RequestBody SettlementCreateRequest request) {
		Long settlementId = settlementService.createSettlement(request);
		return ResponseEntity.ok(ApiResponse.success("정산 내역이 생성되었습니다.", settlementId));
	}

	@GetMapping("/{settlementId}")
	public ResponseEntity<ApiResponse<SettlementResponse>> getSettlement(@PathVariable Long settlementId,
			Authentication authentication) {
		return ResponseEntity.ok(
				ApiResponse.success("정산 조회 완료", settlementService.getSettlement(settlementId, getMemberId(authentication))));
	}

	// ⭐ PDF "정산 관리" 화면 (시공사/자재업체 로그인 기준 - 본인 정산 내역, 페이지네이션)
	@GetMapping("/partner/me")
	public ResponseEntity<ApiResponse<Page<SettlementResponse>>> getMySettlements(
			@PageableDefault(size = 20) Pageable pageable, Authentication authentication) {
		Long partnerId = getMemberId(authentication);
		return ResponseEntity
				.ok(ApiResponse.success("정산 목록 조회 완료", settlementService.getSettlementsByPartner(partnerId, pageable)));
	}

	// ⭐ PDF "정산/수수료 관리(관리자)" - 정산 완료 처리 버튼
	@PostMapping("/{settlementId}/complete")
	public ResponseEntity<ApiResponse<Void>> complete(@PathVariable Long settlementId) {
		settlementService.complete(settlementId);
		return ResponseEntity.ok(ApiResponse.success("정산이 완료 처리되었습니다.", null));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
