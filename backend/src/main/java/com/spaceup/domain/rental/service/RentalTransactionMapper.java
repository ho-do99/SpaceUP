package com.spaceup.domain.rental.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.spaceup.domain.rental.client.MolitRentalItem;
import com.spaceup.domain.rental.entity.RentalTransaction;

@Component
public class RentalTransactionMapper {

	public RentalTransaction map(MolitRentalItem item) {
		Map<String, String> fields = item.fields();
		return RentalTransaction.builder()
				.apartmentName(value(fields, "aptNm"))
				.apartmentSequence(value(fields, "aptSeq"))
				.buildYear(integer(fields, "buildYear"))
				.contractTerm(value(fields, "contractTerm"))
				.contractType(value(fields, "contractType"))
				.dealDay(integer(fields, "dealDay"))
				.dealMonth(integer(fields, "dealMonth"))
				.dealYear(integer(fields, "dealYear"))
				.deposit(money(fields, "deposit"))
				.exclusiveUseArea(decimal(fields, "excluUseAr"))
				.floor(integer(fields, "floor"))
				.jibun(value(fields, "jibun"))
				.monthlyRent(money(fields, "monthlyRent"))
				.previousDeposit(money(fields, "preDeposit"))
				.previousMonthlyRent(money(fields, "preMonthlyRent"))
				.roadName(value(fields, "roadnm"))
				.roadNameBasementCode(value(fields, "roadnmbcd"))
				.roadNameMainNumber(value(fields, "roadnmbonbun"))
				.roadNameSubNumber(value(fields, "roadnmbubun"))
				.roadNameCode(value(fields, "roadnmcd"))
				.roadNameSequence(value(fields, "roadnmseq"))
				.roadNameSggCode(value(fields, "roadnmsggcd"))
				.sggCode(value(fields, "sggCd"))
				.umdName(value(fields, "umdNm"))
				.renewalRequestRightUsed(value(fields, "useRRRight"))
				.sourceKey(sourceKey(fields))
				.rawPayload(new LinkedHashMap<>(fields))
				.build();
	}

	private String sourceKey(Map<String, String> fields) {
		String canonical = fields.entrySet().stream()
				.sorted(Map.Entry.comparingByKey())
				.map(entry -> token(entry.getKey()) + token(normalize(entry.getValue())))
				.collect(Collectors.joining());
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			return HexFormat.of().formatHex(digest.digest(canonical.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 해시 알고리즘을 사용할 수 없습니다.", e);
		}
	}

	private String token(String value) {
		return value.length() + ":" + value;
	}

	private String normalize(String value) {
		return value == null ? "" : value.trim();
	}

	private String value(Map<String, String> fields, String key) {
		String value = normalize(fields.get(key));
		return value.isEmpty() ? null : value;
	}

	private Integer integer(Map<String, String> fields, String key) {
		String value = value(fields, key);
		return value == null ? null : Integer.valueOf(value);
	}

	private Long money(Map<String, String> fields, String key) {
		String value = value(fields, key);
		return value == null ? null : Long.valueOf(value.replaceAll("[,\\s]", ""));
	}

	private BigDecimal decimal(Map<String, String> fields, String key) {
		String value = value(fields, key);
		return value == null ? null : new BigDecimal(value);
	}
}
