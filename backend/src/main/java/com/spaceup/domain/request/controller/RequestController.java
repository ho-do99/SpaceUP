package com.spaceup.domain.request.controller;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.analysis.service.AnalysisJobService;
import com.spaceup.domain.matching.dto.RecommendedContractorResponse;
import com.spaceup.domain.matching.service.ContractorRecommendationService;
import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.domain.request.dto.RequestCreateRequest;
import com.spaceup.domain.request.dto.RequestImageAddRequest;
import com.spaceup.domain.request.dto.RequestImageResponse;
import com.spaceup.domain.request.dto.RequestRejectRequest;
import com.spaceup.domain.request.dto.RequestResponse;
import com.spaceup.domain.request.dto.RequestUpdateRequest;
import com.spaceup.domain.request.entity.RequestImageType;
import com.spaceup.domain.request.service.RequestImageService;
import com.spaceup.domain.request.service.RequestService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class RequestController {

	private final RequestService requestService;
	private final AnalysisJobService analysisJobService;
	private final ContractorRecommendationService contractorRecommendationService;
	private final RequestImageService requestImageService;

	// ⭐ PDF "02 임대 정보 입력" 완료 버튼 → 의뢰 생성 (로그인한 임대인 본인 명의로 생성) + AI 분석 PENDING 등록
	@PostMapping
	public ResponseEntity<ApiResponse<Long>> create(@Valid @RequestBody RequestCreateRequest request,
			Authentication authentication) {
		Long landlordId = getMemberId(authentication);
		Long requestId = requestService.createRequest(landlordId, request);
		analysisJobService.requestAnalysis(requestId, landlordId); // ⭐ ML 파이프라인에 분석을 맡기는 시작점
		return ResponseEntity.ok(ApiResponse.success("의뢰가 등록되었습니다.", requestId));
	}

	// ⭐ PDF "의뢰 상세" 화면 조회
	@GetMapping("/{requestId}")
	public ResponseEntity<ApiResponse<RequestResponse>> getRequest(@PathVariable Long requestId,
			Authentication authentication) {
		return ResponseEntity.ok(
				ApiResponse.success("의뢰 상세 조회 완료", requestService.getRequest(requestId, getMemberId(authentication))));
	}

	// ⭐ [프론트 연동] 예산/희망일정/요청항목처럼 화면 뒤쪽 단계에서 채워지는 값을 나중에 저장. 본인 의뢰만 가능
	@PatchMapping("/{requestId}")
	public ResponseEntity<ApiResponse<Void>> updateRequest(@PathVariable Long requestId,
			@RequestBody RequestUpdateRequest request, Authentication authentication) {
		requestService.updateRequest(requestId, getMemberId(authentication), request);
		return ResponseEntity.ok(ApiResponse.success("의뢰 정보가 수정되었습니다.", null));
	}

	// ⭐ PDF "의뢰 목록" 화면 (시공사 로그인 기준 - 본인에게 배정된 의뢰만 조회, 페이지네이션)
	@GetMapping("/contractor/me")
	public ResponseEntity<ApiResponse<Page<RequestResponse>>> getMyRequestsAsContractor(
			@PageableDefault(size = 20) Pageable pageable, Authentication authentication) {
		Long contractorId = getMemberId(authentication);
		return ResponseEntity
				.ok(ApiResponse.success("의뢰 목록 조회 완료", requestService.getRequestsForContractor(contractorId, pageable)));
	}

	// ⭐ PDF "마이페이지 - 견적 요청 내역" 화면 (임대인 로그인 기준, 페이지네이션)
	@GetMapping("/landlord/me")
	public ResponseEntity<ApiResponse<Page<RequestResponse>>> getMyRequestsAsLandlord(
			@PageableDefault(size = 20) Pageable pageable, Authentication authentication) {
		Long landlordId = getMemberId(authentication);
		return ResponseEntity
				.ok(ApiResponse.success("견적 요청 내역 조회 완료", requestService.getRequestsForLandlord(landlordId, pageable)));
	}

	// ⭐ [시공사 추천 점수] "08 견적 요청하기" 화면에서 시공사를 고르기 전, 추천 상위 3개를 먼저 보여줄 때 사용
	// ⭐ [시공사 추천 점수 고도화] 본인이 등록한 의뢰가 아니면 403 (ContractorRecommendationService에서 검증)
	@GetMapping("/{requestId}/recommended-contractors")
	public ResponseEntity<ApiResponse<List<RecommendedContractorResponse>>> getRecommendedContractors(
			@PathVariable Long requestId, Authentication authentication) {
		Long memberId = getMemberId(authentication);
		return ResponseEntity.ok(
				ApiResponse.success("추천 시공사 조회 완료", contractorRecommendationService.recommend(requestId, memberId)));
	}

	// ⭐ PDF "08 견적 요청하기" 버튼 → 특정 시공사에게 의뢰를 배정 (본인 의뢰만 가능)
	@PostMapping("/{requestId}/assign/{contractorId}")
	public ResponseEntity<ApiResponse<Void>> assignContractor(@PathVariable Long requestId,
			@PathVariable Long contractorId, Authentication authentication) {
		requestService.assignContractor(requestId, contractorId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("시공사에게 견적 요청이 전달되었습니다.", null));
	}

	// ⭐ PDF "의뢰 상세" 화면의 "의뢰 승인" 버튼 (배정받은 시공사 본인만)
	@PostMapping("/{requestId}/approve")
	public ResponseEntity<ApiResponse<Void>> approve(@PathVariable Long requestId, Authentication authentication) {
		requestService.approve(requestId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("의뢰를 승인했습니다.", null));
	}

	// ⭐ PDF "의뢰 상세" 화면의 "의뢰 거절" 버튼 (배정받은 시공사 본인만)
	// ⭐ [Figma 반영] "거절 사유" 화면 입력값(reason/detail)을 함께 받도록 변경
	@PostMapping("/{requestId}/reject")
	public ResponseEntity<ApiResponse<Void>> reject(@PathVariable Long requestId,
			@Valid @RequestBody RequestRejectRequest request, Authentication authentication) {
		requestService.reject(requestId, getMemberId(authentication), request.getReason(), request.getDetail());
		return ResponseEntity.ok(ApiResponse.success("의뢰를 거절했습니다.", null));
	}

	// ⭐ [프론트 연동] 이미지 업로드 API(POST /api/files/images)가 돌려준 imageUrl을 의뢰에 연결. 본인 의뢰만 가능
	@PostMapping("/{requestId}/images")
	public ResponseEntity<ApiResponse<Long>> addImage(@PathVariable Long requestId,
			@Valid @RequestBody RequestImageAddRequest request, Authentication authentication) {
		Long imageId = requestImageService.addImage(requestId, getMemberId(authentication), request);
		return ResponseEntity.ok(ApiResponse.success("이미지가 의뢰에 연결되었습니다.", imageId));
	}

	// ⭐ imageType 쿼리파라미터를 안 주면 평면도+집사진 전체를 반환합니다.
	@GetMapping("/{requestId}/images")
	public ResponseEntity<ApiResponse<List<RequestImageResponse>>> getImages(@PathVariable Long requestId,
			@RequestParam(required = false) RequestImageType imageType, Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("이미지 목록 조회 완료",
				requestImageService.getImages(requestId, imageType, getMemberId(authentication))));
	}

	@DeleteMapping("/{requestId}/images/{imageId}")
	public ResponseEntity<ApiResponse<Void>> deleteImage(@PathVariable Long requestId, @PathVariable Long imageId,
			Authentication authentication) {
		requestImageService.deleteImage(requestId, imageId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("이미지가 삭제되었습니다.", null));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
