package com.spaceup.domain.ai.client;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.spaceup.domain.ai.exception.AiImageGenerationConfigurationException;
import com.spaceup.domain.ai.exception.AiImageGenerationException;
import com.spaceup.domain.ai.provider.GeneratedImage;
import com.spaceup.domain.ai.provider.ImageGenerationProvider;

import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

// ⭐ [AI 인테리어 이미지 생성] Gemini 2.5 Flash Image(생성형 이미지) REST API 실연동.
// GEMINI_API_KEY 환경변수만 채워지면 바로 동작합니다 - 이 파일에는 실제 키를 절대 하드코딩하지 않습니다.
// 참고: generativelanguage.googleapis.com의 {model}:generateContent 엔드포인트에 이미지 생성을 요청하면
// candidates[0].content.parts[] 중 inlineData(base64)를 가진 파트가 결과 이미지입니다.
@Slf4j
@Component
public class GeminiImageClient implements ImageGenerationProvider {

	private final RestClient restClient;
	private final GeminiProperties properties;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public GeminiImageClient(@Qualifier("geminiRestClient") RestClient restClient, GeminiProperties properties) {
		this.restClient = restClient;
		this.properties = properties;
	}

	@Override
	public boolean isConfigured() {
		return properties.isConfigured();
	}

	@Override
	public List<GeneratedImage> generate(String prompt, Optional<GeneratedImage> referenceImage) {
		if (!isConfigured()) {
			throw new AiImageGenerationConfigurationException("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.");
		}

		List<Map<String, Object>> parts = new ArrayList<>();
		parts.add(Map.of("text", prompt));
		referenceImage.ifPresent(image -> parts.add(Map.of("inlineData",
				Map.of("mimeType", image.mimeType(), "data", Base64.getEncoder().encodeToString(image.data())))));

		Map<String, Object> requestBody = Map.of("contents", List.of(Map.of("parts", parts)), "generationConfig",
				Map.of("responseModalities", List.of("TEXT", "IMAGE")));

		try {
			String responseJson = restClient.post().uri("/v1beta/models/{model}:generateContent", properties.getModel())
					.header("x-goog-api-key", properties.getApiKey()).body(requestBody).retrieve().body(String.class);
			return parseImages(responseJson);
		} catch (RestClientException e) {
			throw new AiImageGenerationException("Gemini 이미지 생성 API 호출에 실패했습니다.", e);
		} catch (tools.jackson.core.JacksonException e) {
			throw new AiImageGenerationException("Gemini 응답 파싱에 실패했습니다.", e);
		}
	}

	private List<GeneratedImage> parseImages(String responseJson) {
		JsonNode root = objectMapper.readTree(responseJson);
		JsonNode candidates = root.path("candidates");
		List<GeneratedImage> images = new ArrayList<>();
		for (JsonNode candidate : candidates) {
			for (JsonNode part : candidate.path("content").path("parts")) {
				JsonNode inlineData = part.path("inlineData");
				if (!inlineData.isMissingNode() && inlineData.has("data")) {
					byte[] data = Base64.getDecoder().decode(inlineData.path("data").asString());
					String mimeType = inlineData.path("mimeType").asString("image/png");
					images.add(new GeneratedImage(data, mimeType));
				}
			}
		}
		if (images.isEmpty()) {
			// ⭐ [정보 노출 수정] 원본 응답(모델 버전/세이프티 차단 사유 등 내부 정보 포함 가능)은 서버 로그에만
			// 남기고, 클라이언트에는 일반화된 메시지만 돌려줍니다.
			log.warn("Gemini 응답에 생성된 이미지가 없습니다: {}", responseJson);
			throw new AiImageGenerationException("이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
		}
		return images;
	}
}
