package com.spaceup.domain.analysis.ai.client;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

// ⭐ [AI/OCR 연동] origin/ai 브랜치 조사 결과, 실제로 동작하는 평면도 분석 파이프라인은
// viewerwall 서비스(포트 8004)의 POST /api/analyze 하나뿐입니다(OCR+세그멘테이션 결과를 합쳐서 반환).
// 백엔드의 AI_BASE_URL(포트 8000, ai/app)은 현재 빈 값만 돌려주는 스텁이라 여기서는 쓰지 않습니다.
@Getter
@Setter
@ConfigurationProperties(prefix = "external-api.ai-floorplan")
public class AiFloorplanProperties {

	private String baseUrl = "http://localhost:8004";
	private Duration connectTimeout = Duration.ofSeconds(5);
	private Duration readTimeout = Duration.ofSeconds(30);
}
