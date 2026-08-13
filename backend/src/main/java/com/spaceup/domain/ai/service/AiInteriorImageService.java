package com.spaceup.domain.ai.service;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.ai.dto.InteriorImageGenerateRequest;
import com.spaceup.domain.ai.dto.InteriorImageGenerateResponse;
import com.spaceup.domain.ai.dto.InteriorImageGenerationStatus;
import com.spaceup.domain.ai.dto.InteriorImageStatusResponse;
import com.spaceup.domain.ai.exception.AiImageGenerationException;
import com.spaceup.domain.ai.exception.AiImageGenerationInProgressException;
import com.spaceup.domain.ai.provider.GeneratedImage;
import com.spaceup.domain.ai.provider.ImageGenerationProvider;
import com.spaceup.domain.file.service.ImageStoreService;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.dto.RequestImageAddRequest;
import com.spaceup.domain.request.entity.RequestImageType;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.request.service.RequestImageService;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.RequestNotFoundException;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "AI 인테리어 이미지 생성" 화면. GEMINI_API_KEY만 설정하면 바로 동작합니다.
// Provider는 인터페이스로 추상화되어 있어 향후 다른 이미지 생성 모델로 교체/추가해도 이 서비스는 그대로 씁니다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiInteriorImageService {

	private static final String IMAGE_URL_PREFIX = "/api/files/images/";

	private final ImageGenerationProvider imageGenerationProvider;
	private final ImageStoreService imageStoreService;
	private final QuoteRequestRepository quoteRequestRepository;
	private final RequestImageService requestImageService;

	// ⭐ [중복 생성 방지] 생성 자체가 완전히 동기 호출이라(별도 job/상태 테이블 없음), "생성 중" 페이지에서
	// 새로고침 후 같은 requestId로 재요청하면 Gemini가 두 번 호출되어 결과 이미지가 중복 저장될 수 있었습니다.
	// requestId 단위로 진행 중 표시를 남겨서, 이미 진행 중인 요청은 두 번째 호출에서 바로 409로 거절합니다.
	// (여러 서버 인스턴스로 수평 확장하면 이 인메모리 잠금은 인스턴스별로 따로 동작합니다 - 지금 규모에선
	// 충분하지만, 나중에 확장하면 DB 락이나 Redis 기반 잠금으로 바꿔야 합니다.)
	private final Set<Long> inProgressRequestIds = ConcurrentHashMap.newKeySet();

	@Transactional
	public InteriorImageGenerateResponse generate(Long requestId, Long landlordId, InteriorImageGenerateRequest dto) {
		if (!inProgressRequestIds.add(requestId)) {
			throw new AiImageGenerationInProgressException(
					"이미 이 의뢰에 대한 AI 인테리어 이미지 생성이 진행 중입니다. 완료될 때까지 기다려 주세요: " + requestId);
		}
		try {
			QuoteRequest request = quoteRequestRepository.findById(requestId)
					.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
			if (!request.getOwner().getId().equals(landlordId)) {
				throw new ForbiddenAccessException("본인이 등록한 의뢰만 AI 인테리어 이미지를 생성할 수 있습니다.");
			}

			String prompt = buildPrompt(request, dto.getStyle());
			Optional<GeneratedImage> referenceImage = loadReferenceImage(dto.getReferenceImageUrl());

			List<GeneratedImage> results = imageGenerationProvider.generate(prompt, referenceImage);
			List<String> imageUrls = results.stream().map(this::store).toList();
			imageUrls.forEach(imageUrl -> connectGeneratedImage(requestId, landlordId, imageUrl));
			return new InteriorImageGenerateResponse(imageUrls);
		} finally {
			inProgressRequestIds.remove(requestId);
		}
	}

	// ⭐ [프론트 연동] "생성 중" 페이지를 새로고침했을 때, 새 생성 요청을 보내는 대신 먼저 이 API로 현재
	// 상태를 확인할 수 있습니다. HTTP 상태 코드는 요청 자체(존재/권한)의 성공 여부만 나타내고 - 늘 200 -
	// 실제 생성 진행 상태는 항상 body의 status 필드로 구분합니다(AnalysisJob의 status 필드와 동일한
	// 패턴). 세 가지 경우:
	// - COMPLETED: request_image(AI_GENERATED)가 이미 있음 → imageUrls에 결과가 들어있음
	// - IN_PROGRESS: 아직 결과는 없지만 이 requestId로 generate()가 지금 실행 중(다른 탭/이전 요청)
	// - NOT_STARTED: 결과도 없고 진행 중도 아님 → 이 의뢰로 생성을 요청한 적이 없음
	public InteriorImageStatusResponse getGenerationStatus(Long requestId, Long landlordId) {
		QuoteRequest request = quoteRequestRepository.findById(requestId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
		if (!request.getOwner().getId().equals(landlordId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰의 AI 인테리어 이미지만 조회할 수 있습니다.");
		}
		List<String> imageUrls = requestImageService.getImages(requestId, RequestImageType.AI_GENERATED, landlordId)
				.stream().map(image -> image.imageUrl()).toList();
		if (!imageUrls.isEmpty()) {
			return new InteriorImageStatusResponse(InteriorImageGenerationStatus.COMPLETED, imageUrls);
		}
		if (inProgressRequestIds.contains(requestId)) {
			return new InteriorImageStatusResponse(InteriorImageGenerationStatus.IN_PROGRESS, List.of());
		}
		return new InteriorImageStatusResponse(InteriorImageGenerationStatus.NOT_STARTED, List.of());
	}

	private void connectGeneratedImage(Long requestId, Long landlordId, String imageUrl) {
		RequestImageAddRequest request = new RequestImageAddRequest();
		request.setImageType(RequestImageType.AI_GENERATED);
		request.setImageUrl(imageUrl);
		requestImageService.addImage(requestId, landlordId, request);
	}

	private String buildPrompt(QuoteRequest request, String style) {
		String housingType = request.getProperty().getHousingType();
		return String.format(
				"다음 조건에 맞는 실내 인테리어 리모델링 결과 이미지를 생성해 주세요. 주택 유형: %s, 원하는 스타일: %s. "
						+ "사실적인 사진 스타일로, 참고 이미지가 있다면 같은 공간 구조를 유지하면서 스타일만 변경해 주세요.",
				housingType, style);
	}

	private Optional<GeneratedImage> loadReferenceImage(String referenceImageUrl) {
		if (referenceImageUrl == null || referenceImageUrl.isBlank()) {
			return Optional.empty();
		}
		if (!referenceImageUrl.startsWith(IMAGE_URL_PREFIX)) {
			throw new IllegalArgumentException("referenceImageUrl은 /api/files/images/ 로 시작하는 값이어야 합니다.");
		}
		String storeFileName = referenceImageUrl.substring(IMAGE_URL_PREFIX.length());
		Resource resource = imageStoreService.loadAsResource(storeFileName);
		try {
			byte[] data = resource.getContentAsByteArray();
			return Optional.of(new GeneratedImage(data, resolveMimeType(storeFileName)));
		} catch (IOException e) {
			throw new AiImageGenerationException("참고 이미지를 읽는 중 오류가 발생했습니다: " + referenceImageUrl, e);
		}
	}

	private String store(GeneratedImage image) {
		String extension = image.mimeType().contains("png") ? ".png" : ".jpg";
		String storeFileName = imageStoreService.storeBytes(image.data(), extension);
		return IMAGE_URL_PREFIX + storeFileName;
	}

	private String resolveMimeType(String fileName) {
		String lower = fileName.toLowerCase();
		if (lower.endsWith(".png")) {
			return "image/png";
		}
		if (lower.endsWith(".webp")) {
			return "image/webp";
		}
		return "image/jpeg";
	}
}
