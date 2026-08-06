package com.spaceup.domain.analysis.ai.exception;

public class AiFloorplanAnalysisException extends RuntimeException {
	public AiFloorplanAnalysisException(String message) {
		super(message);
	}

	public AiFloorplanAnalysisException(String message, Throwable cause) {
		super(message, cause);
	}
}
