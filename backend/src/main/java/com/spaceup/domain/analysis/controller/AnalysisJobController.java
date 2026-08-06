package com.spaceup.domain.analysis.controller;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.spaceup.domain.analysis.ai.service.AiFloorplanAnalysisService;
import com.spaceup.domain.analysis.dto.AnalysisJobEditRequest;
import com.spaceup.domain.analysis.dto.AnalysisJobResponse;
import com.spaceup.domain.analysis.dto.AnalysisJobResultRequest;
import com.spaceup.domain.analysis.dto.AnalysisSpaceRequest;
import com.spaceup.domain.analysis.dto.AnalysisSpaceResponse;
import com.spaceup.domain.analysis.service.AnalysisJobService;
import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.domain.product.dto.RecommendedProductResponse;
import com.spaceup.domain.product.service.ProductRecommendationService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

// ⭐ PDF "공간 정보 확인" / "의뢰 상세 - AI분석" 화면. 결과 제출(submit)은 외부 ML 파이프라인의 콜백 용도라
// 실제 운영에서는 서버 간 인증(API Key 등)으로 별도 보호하는 게 좋습니다 (지금은 JWT 인증만 걸려 있음).
@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
@Validated
public class AnalysisJobController {

	private final AnalysisJobService analysisJobService;
	private final ProductRecommendationService productRecommendationService;
	private final AiFloorplanAnalysisService aiFloorplanAnalysisService;

	// ⭐ PDF "02 임대 정보 입력" 완료 직후 - 분석을 PENDING 상태로 요청
	@PostMapping("/request/{requestId}")
	public ResponseEntity<ApiResponse<Long>> requestAnalysis(@PathVariable Long requestId,
			Authentication authentication) {
		Long analysisId = analysisJobService.requestAnalysis(requestId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("분석 요청이 접수되었습니다.", analysisId));
	}

	// ⭐ ML 파이프라인 콜백 (또는 관리자 수동 보정)
	@PostMapping("/request/{requestId}/result")
	public ResponseEntity<ApiResponse<Void>> submitResult(@PathVariable Long requestId,
			@Valid @RequestBody AnalysisJobResultRequest request) {
		analysisJobService.submitResult(requestId, request);
		return ResponseEntity.ok(ApiResponse.success("분석 결과가 반영되었습니다.", null));
	}

	// ⭐ [프론트 연동] "공간 정보 확인" 화면에서 사용자가 방 개수/욕실 개수/발코니 유무/주방 형태/면적을 직접 수정
	@PatchMapping("/request/{requestId}")
	public ResponseEntity<ApiResponse<Void>> updateBasicInfo(@PathVariable Long requestId,
			@RequestBody AnalysisJobEditRequest request, Authentication authentication) {
		analysisJobService.updateBasicInfo(requestId, getMemberId(authentication), request);
		return ResponseEntity.ok(ApiResponse.success("분석 결과가 수정되었습니다.", null));
	}

	@PostMapping("/request/{requestId}/fail")
	public ResponseEntity<ApiResponse<Void>> markFailed(@PathVariable Long requestId) {
		analysisJobService.markFailed(requestId);
		return ResponseEntity.ok(ApiResponse.success("분석 실패로 처리되었습니다.", null));
	}

	// ⭐ [프론트 연동] 평면도 이미지를 AI 세그멘테이션/OCR 서비스로 보내 방 개수/욕실개수/발코니유무/방 이름을
	// 자동으로 채웁니다. 면적(m²)은 AI가 계산하지 못해 비워두며, 사용자가 이후 직접 입력해야 합니다.
	@PostMapping("/request/{requestId}/floorplan-scan")
	public ResponseEntity<ApiResponse<AnalysisJobResponse>> scanFloorplan(@PathVariable Long requestId,
			@RequestParam("file") MultipartFile file, Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return ResponseEntity.ok(
				ApiResponse.success("AI 평면도 분석이 완료되었습니다.", aiFloorplanAnalysisService.analyze(requestId, principal.getId(), file)));
	}

	// ⭐ PDF "공간 정보 확인" 화면 조회
	@GetMapping("/request/{requestId}")
	public ResponseEntity<ApiResponse<AnalysisJobResponse>> getByRequest(@PathVariable Long requestId,
			Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("분석 결과 조회 완료",
				analysisJobService.getByRequest(requestId, getMemberId(authentication))));
	}

	// ⭐ [프론트 연동] "공간 정보 수정" 화면 - 편집한 공간(방) 목록 전체를 한 번에 교체 저장
	@PutMapping("/request/{requestId}/spaces")
	public ResponseEntity<ApiResponse<Void>> replaceSpaces(@PathVariable Long requestId,
			@Valid @NotEmpty(message = "공간 목록은 최소 1개 이상이어야 합니다.") @RequestBody List<AnalysisSpaceRequest> request,
			Authentication authentication) {
		analysisJobService.replaceSpaces(requestId, getMemberId(authentication), request);
		return ResponseEntity.ok(ApiResponse.success("공간 정보가 저장되었습니다.", null));
	}

	@GetMapping("/request/{requestId}/spaces")
	public ResponseEntity<ApiResponse<List<AnalysisSpaceResponse>>> getSpaces(@PathVariable Long requestId,
			Authentication authentication) {
		return ResponseEntity.ok(
				ApiResponse.success("공간 목록 조회 완료", analysisJobService.getSpaces(requestId, getMemberId(authentication))));
	}

	// ⭐ [프론트 연동] "추천 상품" 화면 - 분석 결과 기반 바닥재/벽지 추천 (카테고리별 상위 3개)
	@GetMapping("/request/{requestId}/recommended-products")
	public ResponseEntity<ApiResponse<List<RecommendedProductResponse>>> getRecommendedProducts(
			@PathVariable Long requestId, Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("추천 상품 조회 완료",
				productRecommendationService.recommend(requestId, getMemberId(authentication))));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
