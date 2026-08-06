package com.spaceup.domain.ai.provider;

import java.util.List;
import java.util.Optional;

// ⭐ [AI 인테리어 이미지 생성] 공급자 추상화 - 지금은 GeminiImageProvider만 구현하지만, 향후 OpenAI(DALL-E)/
// Flux/Stable Diffusion 등을 추가할 때 이 인터페이스만 구현하면 AiInteriorImageService는 변경할 필요가 없습니다.
public interface ImageGenerationProvider {

	// ⭐ referenceImage: 실내 사진을 참고해 리모델링 결과를 생성할 때 사용(없으면 텍스트 프롬프트만으로 생성)
	List<GeneratedImage> generate(String prompt, Optional<GeneratedImage> referenceImage);

	boolean isConfigured();
}
