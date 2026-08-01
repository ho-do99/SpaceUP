package com.spaceup.domain.rental.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import com.spaceup.domain.rental.entity.RentalTransaction;

@DataJpaTest(properties = {
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.datasource.url=jdbc:h2:mem:rental;MODE=MySQL;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver"
})
class RentalTransactionRepositoryTest {

	@Autowired
	private RentalTransactionRepository repository;

	@Test
	void sourceKeyIsUnique() {
		repository.saveAndFlush(transaction(
				"a".repeat(64), "11110", 2026, 7));

		assertThatThrownBy(() -> repository.saveAndFlush(transaction(
				"a".repeat(64), "11110", 2026, 7)))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void filtersByRegionAndContractMonth() {
		repository.saveAndFlush(transaction(
				"b".repeat(64), "11110", 2026, 7));
		repository.saveAndFlush(transaction(
				"c".repeat(64), "11110", 2026, 6));

		Page<RentalTransaction> page =
				repository.findBySggCodeAndDealYearAndDealMonth(
						"11110", 2026, 7, PageRequest.of(0, 20));

		assertThat(page.getTotalElements()).isEqualTo(1);
		assertThat(page.getContent().getFirst().getDealMonth()).isEqualTo(7);
	}

	private RentalTransaction transaction(
			String sourceKey,
			String sggCode,
			int dealYear,
			int dealMonth) {
		return RentalTransaction.builder()
				.apartmentName("테스트아파트")
				.sggCode(sggCode)
				.dealYear(dealYear)
				.dealMonth(dealMonth)
				.sourceKey(sourceKey)
				.rawPayload(Map.of("aptNm", "테스트아파트"))
				.build();
	}
}
