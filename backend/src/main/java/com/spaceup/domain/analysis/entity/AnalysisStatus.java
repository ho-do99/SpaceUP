package com.spaceup.domain.analysis.entity;

// ⭐ 분석은 외부 ML 파이프라인 호출이라 즉시 끝나지 않을 수 있어 상태를 둡니다.
public enum AnalysisStatus {
	PENDING, // 분석 요청됨, 결과 대기 중
	COMPLETED, // 분석 완료
	FAILED // 분석 실패 (재요청 필요)
}
