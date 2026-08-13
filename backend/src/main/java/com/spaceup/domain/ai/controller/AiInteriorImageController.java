package com.spaceup.domain.ai.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.ai.dto.InteriorImageGenerateRequest;
import com.spaceup.domain.ai.dto.InteriorImageGenerateResponse;
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

	// ⭐ [프론트 연동] "생성 중" 화면 새로고침 대응 - 새 생성 요청을 다시 보내지 않고 이 requestId에 이미
	// 저장된 AI 생성 이미지가 있는지 조회합니다. 아직 하나도 생성된 게 없으면 imageUrls가 빈 배열로 옵니다.
	@GetMapping("/{requestId}/interior-images")
	public ResponseEntity<ApiResponse<InteriorImageGenerateResponse>> getGenerated(@PathVariable Long requestId,
			Authentication authentication) {
		return ResponseEntity.ok(ApiResponse.success("AI 인테리어 이미지 조회 완료",
				aiInteriorImageService.getGeneratedImages(requestId, getMemberId(authentication))));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
