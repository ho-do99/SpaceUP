package com.spaceup.domain.quote.controller;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.domain.quote.dto.ContractorQuoteCreateRequest;
import com.spaceup.domain.quote.dto.ContractorQuoteExtendRequest;
import com.spaceup.domain.quote.dto.ContractorQuoteResponse;
import com.spaceup.domain.quote.dto.ContractorQuoteRevisionRequest;
import com.spaceup.domain.quote.service.ContractorQuoteService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/quotes")
@RequiredArgsConstructor
public class ContractorQuoteController {

	private final ContractorQuoteService contractorQuoteService;

	// ⭐ PDF "견적 작성 - 임시 저장" (시공사 로그인 기준)
	@PostMapping
	public ResponseEntity<ApiResponse<Long>> createDraft(@Valid @RequestBody ContractorQuoteCreateRequest request,
			Authentication authentication) {
		Long contractorId = getMemberId(authentication);
		Long quoteId = contractorQuoteService.createDraft(contractorId, request);
		return ResponseEntity.ok(ApiResponse.success("견적이 임시 저장되었습니다.", quoteId));
	}

	@GetMapping("/{quoteId}")
	public ResponseEntity<ApiResponse<ContractorQuoteResponse>> getQuote(@PathVariable Long quoteId) {
		return ResponseEntity.ok(ApiResponse.success("견적 조회 완료", contractorQuoteService.getQuote(quoteId)));
	}

	// ⭐ 하나의 의뢰에 달린 견적 이력 전체 (재견적 포함 - "v1/v2..." 버전은 이 목록의 순서/revisionCount로 구분)
	@GetMapping("/request/{requestId}")
	public ResponseEntity<ApiResponse<List<ContractorQuoteResponse>>> getQuotesByRequest(
			@PathVariable Long requestId) {
		return ResponseEntity
				.ok(ApiResponse.success("견적 목록 조회 완료", contractorQuoteService.getQuotesByRequest(requestId)));
	}

	// ⭐ PDF "견적 제안 보내기" 버튼
	@PostMapping("/{quoteId}/submit")
	public ResponseEntity<ApiResponse<Void>> submit(@PathVariable Long quoteId, Authentication authentication) {
		contractorQuoteService.submit(quoteId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("견적을 발송했습니다.", null));
	}

	// ⭐ 임대인이 마이페이지 등에서 견적을 최종 선택
	@PostMapping("/{quoteId}/accept")
	public ResponseEntity<ApiResponse<Void>> accept(@PathVariable Long quoteId, Authentication authentication) {
		contractorQuoteService.accept(quoteId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("견적을 선택했습니다.", null));
	}

	@PostMapping("/{quoteId}/reject")
	public ResponseEntity<ApiResponse<Void>> reject(@PathVariable Long quoteId, Authentication authentication) {
		contractorQuoteService.reject(quoteId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("견적을 거절했습니다.", null));
	}

	// ⭐ [Figma 반영] "유효기간 연장" 화면 - 작성한 시공사 본인만
	@PostMapping("/{quoteId}/extend")
	public ResponseEntity<ApiResponse<Void>> extend(@PathVariable Long quoteId,
			@Valid @RequestBody ContractorQuoteExtendRequest request, Authentication authentication) {
		contractorQuoteService.extendValidity(quoteId, getMemberId(authentication), request.getNewValidUntil());
		return ResponseEntity.ok(ApiResponse.success("견적 유효기간이 연장되었습니다.", null));
	}

	// ⭐ [Figma 반영] "보낸 견적 상세 - 수정 요청" 화면 - 해당 의뢰의 임대인 본인만
	@PostMapping("/{quoteId}/request-revision")
	public ResponseEntity<ApiResponse<Void>> requestRevision(@PathVariable Long quoteId,
			@Valid @RequestBody ContractorQuoteRevisionRequest request, Authentication authentication) {
		contractorQuoteService.requestRevision(quoteId, getMemberId(authentication), request.getNote());
		return ResponseEntity.ok(ApiResponse.success("수정 요청을 전달했습니다.", null));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
