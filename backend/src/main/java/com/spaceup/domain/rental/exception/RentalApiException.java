package com.spaceup.domain.rental.exception;

public class RentalApiException extends RuntimeException {

	public RentalApiException(String message) {
		super(message);
	}

	public RentalApiException(String message, Throwable cause) {
		super(message, cause);
	}
}
