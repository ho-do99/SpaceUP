package com.spaceup.global.error;

public class FileNotFoundException extends RuntimeException {
	public FileNotFoundException(String message) {
		super(message);
	}
}