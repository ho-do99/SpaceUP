package com.spaceup.domain.portfolio.controller;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.domain.portfolio.dto.PortfolioCreateRequest;
import com.spaceup.domain.portfolio.dto.PortfolioResponse;
import com.spaceup.domain.portfolio.service.PortfolioService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

// ⭐ [Figma 반영] PDF "포트폴리오 관리/등록/수정" 화면 전체
@RestController
@RequestMapping("/api/portfolios")
@RequiredArgsConstructor
public class PortfolioController {

	private final PortfolioService portfolioService;

	@PostMapping
	public ResponseEntity<ApiResponse<Long>> create(@Valid @RequestBody PortfolioCreateRequest request,
			Authentication authentication) {
		Long contractorId = getMemberId(authentication);
		return ResponseEntity
				.ok(ApiResponse.success("포트폴리오가 등록되었습니다.", portfolioService.create(contractorId, request)));
	}

	@GetMapping("/me")
	public ResponseEntity<ApiResponse<List<PortfolioResponse>>> getMyPortfolios(Authentication authentication) {
		Long contractorId = getMemberId(authentication);
		return ResponseEntity.ok(ApiResponse.success("포트폴리오 목록 조회 완료", portfolioService.getMyPortfolios(contractorId)));
	}

	// ⭐ [보안 수정] 로그인 없이도 호출 가능한 엔드포인트라 authentication이 null이거나 익명일 수 있습니다.
	@GetMapping("/{portfolioId}")
	public ResponseEntity<ApiResponse<PortfolioResponse>> getPortfolio(@PathVariable Long portfolioId,
			Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("포트폴리오 조회 완료",
				portfolioService.getPortfolio(portfolioId, getMemberIdOrNull(authentication))));
	}

	// ⭐ [프론트 연동] "시공사 상세" 화면에서 특정 시공사의 공개 포트폴리오 목록을 보여줄 때 사용
	@GetMapping("/contractor/{contractorId}")
	public ResponseEntity<ApiResponse<List<PortfolioResponse>>> getPublicPortfolios(@PathVariable Long contractorId) {
		return ResponseEntity
				.ok(ApiResponse.success("포트폴리오 목록 조회 완료", portfolioService.getPublicPortfolios(contractorId)));
	}

	@PutMapping("/{portfolioId}")
	public ResponseEntity<ApiResponse<Void>> update(@PathVariable Long portfolioId,
			@Valid @RequestBody PortfolioCreateRequest request, Authentication authentication) {
		Long contractorId = getMemberId(authentication);
		portfolioService.update(portfolioId, contractorId, request);
		return ResponseEntity.ok(ApiResponse.success("포트폴리오가 수정되었습니다.", null));
	}

	@DeleteMapping("/{portfolioId}")
	public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long portfolioId, Authentication authentication) {
		Long contractorId = getMemberId(authentication);
		portfolioService.delete(portfolioId, contractorId);
		return ResponseEntity.ok(ApiResponse.success("포트폴리오가 삭제되었습니다.", null));
	}

	@PatchMapping("/{portfolioId}/visibility")
	public ResponseEntity<ApiResponse<Void>> changeVisibility(@PathVariable Long portfolioId,
			@RequestParam boolean isPublic, Authentication authentication) {
		Long contractorId = getMemberId(authentication);
		portfolioService.changeVisibility(portfolioId, contractorId, isPublic);
		return ResponseEntity.ok(ApiResponse.success("공개 설정이 변경되었습니다.", null));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}

	// ⭐ permitAll 엔드포인트에서 비로그인 호출 시 authentication이 null이거나 익명(anonymousUser)일 수 있어
	// 안전하게 memberId를 꺼내는 헬퍼입니다.
	private Long getMemberIdOrNull(Authentication authentication) {
		if (authentication == null || !(authentication.getPrincipal() instanceof MemberPrincipal principal)) {
			return null;
		}
		return principal.getId();
	}
}
