package com.spaceup.global.error;

public class ProjectNotFoundException extends RuntimeException {
	public ProjectNotFoundException(String message) {
		super(message);
	}
}
