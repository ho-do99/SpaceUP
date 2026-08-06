package com.spaceup.domain.review.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.domain.review.dto.ReviewCreateRequest;
import com.spaceup.domain.review.dto.ReviewResponse;
import com.spaceup.domain.review.dto.ReviewSummaryResponse;
import com.spaceup.domain.review.service.ReviewService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "리뷰" 화면. 작성은 임대인만, 조회는 누구나 가능(시공사 상세 화면 등에서 공개 노출)
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

	private final ReviewService reviewService;

	// ⭐ PDF "리뷰 작성" - 공사가 완료(ContractorProject.COMPLETED)된 의뢰에만 작성 가능, 본인 의뢰만
	@PostMapping("/request/{requestId}")
	public ResponseEntity<ApiResponse<ReviewResponse>> create(@PathVariable Long requestId,
			@Valid @RequestBody ReviewCreateRequest request, Authentication authentication) {
		return ResponseEntity.ok(
				ApiResponse.success("리뷰가 등록되었습니다.", reviewService.create(requestId, getMemberId(authentication), request)));
	}

	@GetMapping("/{reviewId}")
	public ResponseEntity<ApiResponse<ReviewResponse>> getReview(@PathVariable Long reviewId) {
		return ResponseEntity.ok(ApiResponse.success("리뷰 조회 완료", reviewService.getReview(reviewId)));
	}

	// ⭐ ContractorReviewListPage 대응 - filter: all(기본) | five | four | three_or_less
	@GetMapping("/contractor/{contractorId}")
	public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getReviewsByContractor(@PathVariable Long contractorId,
			@RequestParam(required = false) String filter, @PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(
				ApiResponse.success("리뷰 목록 조회 완료", reviewService.getReviewsByContractor(contractorId, filter, pageable)));
	}

	@GetMapping("/contractor/{contractorId}/summary")
	public ResponseEntity<ApiResponse<ReviewSummaryResponse>> getSummary(@PathVariable Long contractorId) {
		return ResponseEntity.ok(ApiResponse.success("리뷰 요약 조회 완료", reviewService.getSummary(contractorId)));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
