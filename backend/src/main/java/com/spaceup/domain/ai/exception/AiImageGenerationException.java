package com.spaceup.domain.ai.exception;

public class AiImageGenerationException extends RuntimeException {
	public AiImageGenerationException(String message) {
		super(message);
	}

	public AiImageGenerationException(String message, Throwable cause) {
		super(message, cause);
	}
}
