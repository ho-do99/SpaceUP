package com.spaceup.domain.ai.provider;

// ⭐ Provider 구현체(Gemini/향후 OpenAI/Flux/Stable Diffusion 등)가 공통으로 돌려주는 결과 형태
public record GeneratedImage(byte[] data, String mimeType) {
}
