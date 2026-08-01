package com.spaceup.domain.rental.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.spaceup.domain.rental.client.MolitRentalItem;
import com.spaceup.domain.rental.entity.RentalTransaction;

class RentalTransactionMapperTest {

	private final RentalTransactionMapper mapper = new RentalTransactionMapper();

	@Test
	void convertsKnownTypesAndPreservesEveryRawField() {
		Map<String, String> fields = allFields();
		fields.put("futureField", "preserved");

		RentalTransaction result = mapper.map(new MolitRentalItem(fields));

		assertThat(result.getApartmentName()).isEqualTo("테스트아파트");
		assertThat(result.getDeposit()).isEqualTo(12000L);
		assertThat(result.getMonthlyRent()).isEqualTo(50L);
		assertThat(result.getPreviousDeposit()).isNull();
		assertThat(result.getExclusiveUseArea()).isEqualByComparingTo("84.95");
		assertThat(result.getRawPayload()).containsEntry("futureField", "preserved");
		assertThat(result.getSourceKey()).matches("[0-9a-f]{64}");
	}

	@Test
	void sourceKeyIsStableAcrossFieldOrder() {
		Map<String, String> firstOrder = new LinkedHashMap<>();
		firstOrder.put("aptNm", "테스트아파트");
		firstOrder.put("deposit", "12,000");

		Map<String, String> secondOrder = new LinkedHashMap<>();
		secondOrder.put("deposit", "12,000");
		secondOrder.put("aptNm", "테스트아파트");

		assertThat(mapper.map(new MolitRentalItem(firstOrder)).getSourceKey())
				.isEqualTo(mapper.map(new MolitRentalItem(secondOrder)).getSourceKey());
	}

	@Test
	void changedValueCreatesDifferentSourceKey() {
		assertThat(mapper.map(itemWithDeposit("12,000")).getSourceKey())
				.isNotEqualTo(mapper.map(itemWithDeposit("12,001")).getSourceKey());
	}

	private MolitRentalItem itemWithDeposit(String deposit) {
		return new MolitRentalItem(Map.of("aptNm", "테스트아파트", "deposit", deposit));
	}

	private Map<String, String> allFields() {
		Map<String, String> fields = new LinkedHashMap<>();
		fields.put("aptNm", "테스트아파트");
		fields.put("aptSeq", "11110-1");
		fields.put("buildYear", "2001");
		fields.put("contractTerm", "26.07~28.07");
		fields.put("contractType", "신규");
		fields.put("dealDay", "15");
		fields.put("dealMonth", "7");
		fields.put("dealYear", "2026");
		fields.put("deposit", " 12,000 ");
		fields.put("excluUseAr", "84.95");
		fields.put("floor", "10");
		fields.put("jibun", "1-1");
		fields.put("monthlyRent", "50");
		fields.put("preDeposit", "");
		fields.put("preMonthlyRent", "");
		fields.put("roadnm", "테스트로");
		fields.put("roadnmbcd", "0");
		fields.put("roadnmbonbun", "00100");
		fields.put("roadnmbubun", "00000");
		fields.put("roadnmcd", "1234567");
		fields.put("roadnmseq", "01");
		fields.put("roadnmsggcd", "11110");
		fields.put("sggCd", "11110");
		fields.put("umdNm", "테스트동");
		fields.put("useRRRight", "사용");
		return fields;
	}
}
