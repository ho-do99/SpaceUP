package com.spaceup.global.error;

public class CommentNotFoundException extends RuntimeException {
	public CommentNotFoundException(String message) {
		super(message);
	}
}