package com.spaceup.domain.ai.service;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.ai.dto.InteriorImageGenerateRequest;
import com.spaceup.domain.ai.dto.InteriorImageGenerateResponse;
import com.spaceup.domain.ai.exception.AiImageGenerationException;
import com.spaceup.domain.ai.provider.GeneratedImage;
import com.spaceup.domain.ai.provider.ImageGenerationProvider;
import com.spaceup.domain.file.service.ImageStoreService;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
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

	@Transactional
	public InteriorImageGenerateResponse generate(Long requestId, Long landlordId, InteriorImageGenerateRequest dto) {
		QuoteRequest request = quoteRequestRepository.findById(requestId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
		if (!request.getOwner().getId().equals(landlordId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰만 AI 인테리어 이미지를 생성할 수 있습니다.");
		}

		String prompt = buildPrompt(request, dto.getStyle());
		Optional<GeneratedImage> referenceImage = loadReferenceImage(dto.getReferenceImageUrl());

		List<GeneratedImage> results = imageGenerationProvider.generate(prompt, referenceImage);
		List<String> imageUrls = results.stream().map(this::store).toList();
		return new InteriorImageGenerateResponse(imageUrls);
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
