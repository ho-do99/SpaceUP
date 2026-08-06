package com.spaceup.domain.ai.client;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

// ⭐ [AI 인테리어 이미지 생성] GEMINI_API_KEY 환경변수가 없으면 apiKey가 빈 문자열로 남습니다.
// 실제 키는 어떤 파일에도 하드코딩하지 않고, 로컬에서만 .env.local 등에 채워 넣는 방식을 권장합니다.
@Getter
@Setter
@ConfigurationProperties(prefix = "external-api.gemini")
public class GeminiProperties {

	private String apiKey = "";
	private String baseUrl = "https://generativelanguage.googleapis.com";
	private String model = "gemini-2.5-flash-image";
	private Duration connectTimeout = Duration.ofSeconds(5);
	private Duration readTimeout = Duration.ofSeconds(60); // ⭐ 이미지 생성은 일반 텍스트 응답보다 오래 걸립니다.

	public boolean isConfigured() {
		return apiKey != null && !apiKey.isBlank();
	}
}
