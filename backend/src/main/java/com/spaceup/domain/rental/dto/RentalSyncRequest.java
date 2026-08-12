package com.spaceup.domain.rental.dto;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RentalSyncRequest(
		@NotBlank
		@Pattern(regexp = "\\d{5}", message = "lawdCd는 숫자 5자리여야 합니다.")
		String lawdCd,
		@NotBlank
		@Pattern(regexp = "\\d{6}", message = "dealYm은 yyyyMM 6자리여야 합니다.")
		String dealYm) {

	private static final DateTimeFormatter DEAL_YM_FORMAT =
			DateTimeFormatter.ofPattern("uuuuMM").withResolverStyle(ResolverStyle.STRICT);

	public YearMonth parsedDealYm() {
		return parseDealYm(dealYm);
	}

	public static YearMonth parseDealYm(String dealYm) {
		try {
			return YearMonth.parse(dealYm, DEAL_YM_FORMAT);
		} catch (DateTimeParseException e) {
			throw new IllegalArgumentException(
					"dealYm은 실제 존재하는 yyyyMM이어야 합니다.", e);
		}
	}
}
