package com.spaceup.domain.rental.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

import com.spaceup.domain.rental.entity.RentalTransaction;

public record RentalTransactionResponse(
		Long id,
		String apartmentName,
		String apartmentSequence,
		Integer buildYear,
		String contractTerm,
		String contractType,
		Integer dealDay,
		Integer dealMonth,
		Integer dealYear,
		Long deposit,
		BigDecimal exclusiveUseArea,
		Integer floor,
		String jibun,
		Long monthlyRent,
		Long previousDeposit,
		Long previousMonthlyRent,
		String roadName,
		String roadNameBasementCode,
		String roadNameMainNumber,
		String roadNameSubNumber,
		String roadNameCode,
		String roadNameSequence,
		String roadNameSggCode,
		String sggCode,
		String umdName,
		String renewalRequestRightUsed,
		String sourceKey,
		Map<String, String> rawPayload,
		LocalDateTime createdAt) {

	public static RentalTransactionResponse from(RentalTransaction transaction) {
		Map<String, String> rawPayload = transaction.getRawPayload() == null
				? Map.of()
				: Collections.unmodifiableMap(
						new LinkedHashMap<>(transaction.getRawPayload()));
		return new RentalTransactionResponse(
				transaction.getId(),
				transaction.getApartmentName(),
				transaction.getApartmentSequence(),
				transaction.getBuildYear(),
				transaction.getContractTerm(),
				transaction.getContractType(),
				transaction.getDealDay(),
				transaction.getDealMonth(),
				transaction.getDealYear(),
				transaction.getDeposit(),
				transaction.getExclusiveUseArea(),
				transaction.getFloor(),
				transaction.getJibun(),
				transaction.getMonthlyRent(),
				transaction.getPreviousDeposit(),
				transaction.getPreviousMonthlyRent(),
				transaction.getRoadName(),
				transaction.getRoadNameBasementCode(),
				transaction.getRoadNameMainNumber(),
				transaction.getRoadNameSubNumber(),
				transaction.getRoadNameCode(),
				transaction.getRoadNameSequence(),
				transaction.getRoadNameSggCode(),
				transaction.getSggCode(),
				transaction.getUmdName(),
				transaction.getRenewalRequestRightUsed(),
				transaction.getSourceKey(),
				rawPayload,
				transaction.getCreatedAt());
	}
}
