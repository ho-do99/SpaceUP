package com.spaceup.domain.ai.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.ai.dto.InteriorImageGenerateRequest;
import com.spaceup.domain.ai.dto.InteriorImageGenerateResponse;
import com.spaceup.domain.ai.dto.InteriorImageStatusResponse;
import com.spaceup.domain.ai.service.AiInteriorImageService;
import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "AI 인테리어 이미지 생성" 화면. GEMINI_API_KEY 환경변수가 없으면 503으로 응답합니다
// (global/error/GlobalExceptionHandler의 AiImageGenerationConfigurationException 핸들러 참고)
@RestController
@RequestMapping("/api/analysis/request")
@RequiredArgsConstructor
public class AiInteriorImageController {

	private final AiInteriorImageService aiInteriorImageService;

	@PostMapping("/{requestId}/interior-images")
	public ResponseEntity<ApiResponse<InteriorImageGenerateResponse>> generate(@PathVariable Long requestId,
			@Valid @RequestBody InteriorImageGenerateRequest request, Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("AI 인테리어 이미지가 생성되었습니다.",
				aiInteriorImageService.generate(requestId, getMemberId(authentication), request)));
	}

	// ⭐ [프론트 연동] "생성 중" 화면 새로고침 대응. HTTP 상태는 요청 자체가 유효한 한 항상 200이고,
	// 실제 생성 상태는 body의 status 필드(NOT_STARTED/IN_PROGRESS/COMPLETED)로 구분합니다.
	@GetMapping("/{requestId}/interior-images")
	public ResponseEntity<ApiResponse<InteriorImageStatusResponse>> getGenerated(@PathVariable Long requestId,
			Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("AI 인테리어 이미지 상태 조회 완료",
				aiInteriorImageService.getGenerationStatus(requestId, getMemberId(authentication))));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
