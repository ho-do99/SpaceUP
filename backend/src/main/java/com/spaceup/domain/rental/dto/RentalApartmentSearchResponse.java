package com.spaceup.domain.rental.dto;

import java.math.BigDecimal;

import com.spaceup.domain.rental.entity.RentalTransaction;

// ⭐ [아파트 검색] 실거래가 원본(RentalTransaction)은 거래 건수만큼 같은 아파트가 중복으로 쌓입니다.
// 이 응답은 (아파트명 + 전용면적) 기준으로 대표 거래 1건만 골라 "검색 결과"용으로 가공한 것입니다.
public record RentalApartmentSearchResponse(
		Long id,
		String apartmentName,
		String roadAddress,
		String lotAddress,
		BigDecimal exclusiveAreaM2,
		String sggCode) {

	public static RentalApartmentSearchResponse from(RentalTransaction transaction) {
		String roadAddress = buildRoadAddress(transaction);
		String lotAddress = buildLotAddress(transaction);
		return new RentalApartmentSearchResponse(transaction.getId(), transaction.getApartmentName(), roadAddress,
				lotAddress, transaction.getExclusiveUseArea(), transaction.getSggCode());
	}

	private static String buildRoadAddress(RentalTransaction t) {
		StringBuilder sb = new StringBuilder();
		appendIfPresent(sb, t.getRoadName());
		appendIfPresent(sb, t.getRoadNameMainNumber());
		if (t.getRoadNameSubNumber() != null && !t.getRoadNameSubNumber().isBlank()
				&& !"0".equals(t.getRoadNameSubNumber())) {
			sb.append("-").append(t.getRoadNameSubNumber());
		}
		return sb.toString().trim();
	}

	private static String buildLotAddress(RentalTransaction t) {
		StringBuilder sb = new StringBuilder();
		appendIfPresent(sb, t.getUmdName());
		appendIfPresent(sb, t.getJibun());
		return sb.toString().trim();
	}

	private static void appendIfPresent(StringBuilder sb, String value) {
		if (value != null && !value.isBlank()) {
			if (sb.length() > 0) {
				sb.append(" ");
			}
			sb.append(value);
		}
	}
}
