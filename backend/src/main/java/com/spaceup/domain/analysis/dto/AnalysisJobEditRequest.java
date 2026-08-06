package com.spaceup.domain.analysis.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [프론트 연동] "공간 정보 확인" 화면에서 사용자가 AI 분석 결과 중 일부를 직접 수정할 때 쓰는 요청.
// 값을 보낸 필드만 반영되고(부분 수정), null인 필드는 기존 값을 유지합니다.
// 공간별(방 이름/면적/바닥·벽지 면적/시공선택여부) 정보는 이 API가 아니라
// PUT /api/analysis/request/{requestId}/spaces로 목록 전체를 저장합니다.
@Getter
@Setter
@NoArgsConstructor
public class AnalysisJobEditRequest {

	private Integer roomCount;
	private Integer bathroomCount;
	private Boolean hasBalcony;
	private String kitchenType;
	private Double exclusiveAreaM2; // 전용 면적(㎡) - Property에 반영됨
	private Double ceilingHeightM; // 층고(m) - 매물 전체 기준 단일 값
}
