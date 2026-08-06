package com.spaceup.global.error;

public class ApartmentNotFoundException extends RuntimeException {
	public ApartmentNotFoundException(String message) {
		super(message);
	}
}
