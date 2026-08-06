package com.spaceup.global.error;

public class ReviewNotFoundException extends RuntimeException {
	public ReviewNotFoundException(String message) {
		super(message);
	}
}
