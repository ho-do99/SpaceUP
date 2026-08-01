package com.spaceup.domain.analysis.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [프론트 연동] "공간 정보 확인" 화면에서 사용자가 AI 분석 결과 중 일부를 직접 수정할 때 쓰는 요청.
// 값을 보낸 필드만 반영되고(부분 수정), null인 필드는 기존 값을 유지합니다.
// ⚠️ 층고 / 장판 면적 / 벽지 면적은 현재 스키마(analysis_job, property)에 대응하는 컬럼이 없어 이번 범위에서는
// 제외했습니다 - 추가하려면 DB 팀과 컬럼 신설 협의가 먼저 필요합니다(내부용 보고서 참고).
@Getter
@Setter
@NoArgsConstructor
public class AnalysisJobEditRequest {

	private Integer roomCount;
	private Integer bathroomCount;
	private Boolean hasBalcony;
	private String kitchenType;
	private Double exclusiveAreaM2; // 전용 면적(㎡) - Property에 반영됨
}
