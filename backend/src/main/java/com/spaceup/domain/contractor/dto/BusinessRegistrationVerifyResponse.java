package com.spaceup.domain.contractor.dto;

public record BusinessRegistrationVerifyResponse(boolean valid, String businessRegistrationNumber, String message) {
}
