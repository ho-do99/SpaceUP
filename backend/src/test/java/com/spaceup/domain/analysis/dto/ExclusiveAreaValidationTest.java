package com.spaceup.domain.analysis.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.spaceup.domain.request.dto.RequestUpdateRequest;

import jakarta.validation.Validation;
import jakarta.validation.Validator;

class ExclusiveAreaValidationTest {

	private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

	@Test
	void rejectsNonPositiveAreaFromAnalysisEdit() {
		AnalysisJobEditRequest request = new AnalysisJobEditRequest();
		request.setExclusiveAreaM2(0.0);

		assertThat(validator.validate(request)).anyMatch(violation ->
				violation.getPropertyPath().toString().equals("exclusiveAreaM2"));
	}

	@Test
	void rejectsNonPositiveAreaFromRequestUpdate() {
		RequestUpdateRequest request = new RequestUpdateRequest();
		request.setAreaM2(-1.0);

		assertThat(validator.validate(request)).anyMatch(violation ->
				violation.getPropertyPath().toString().equals("areaM2"));
	}

    @Test
    void rejectsAnInvertedEstimatedQuoteRange() {
            AnalysisJobEditRequest request = new AnalysisJobEditRequest();
            request.setEstimatedQuoteMin(7_650_000L);
            request.setEstimatedQuoteMax(6_260_000L);

            assertThat(validator.validate(request)).anyMatch(violation ->
                            violation.getPropertyPath().toString().equals("estimatedQuoteRangeValid"));
    }
}
