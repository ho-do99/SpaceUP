package com.spaceup.global.error;

// ⭐ DB에 분석(SpaceAnalysis) 결과가 존재하지 않을 때 터트릴 전용 에러입니다.
public class AnalysisNotFoundException extends RuntimeException {
	public AnalysisNotFoundException(String message) {
		super(message);
	}
}
