package com.spaceup.domain.rental.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.YearMonth;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.spaceup.domain.rental.dto.RentalTransactionResponse;
import com.spaceup.domain.rental.entity.RentalTransaction;
import com.spaceup.domain.rental.repository.RentalTransactionRepository;

@ExtendWith(MockitoExtension.class)
class RentalQueryServiceTest {

	@Mock
	private RentalTransactionRepository repository;

	@Test
	void filtersByRegionAndContractMonthAndMapsResponse() {
		PageRequest pageable = PageRequest.of(0, 20);
		RentalTransaction transaction = RentalTransaction.builder()
				.id(1L)
				.apartmentName("테스트아파트")
				.dealYear(2026)
				.dealMonth(7)
				.sggCode("11110")
				.sourceKey("a".repeat(64))
				.rawPayload(Map.of("futureField", "preserved"))
				.build();
		when(repository.findBySggCodeAndDealYearAndDealMonth(
				"11110", 2026, 7, pageable))
				.thenReturn(new PageImpl<>(java.util.List.of(transaction), pageable, 1));
		RentalQueryService service = new RentalQueryService(repository);

		Page<RentalTransactionResponse> result =
				service.find("11110", YearMonth.of(2026, 7), pageable);

		assertThat(result.getTotalElements()).isEqualTo(1);
		assertThat(result.getContent().getFirst().apartmentName())
				.isEqualTo("테스트아파트");
		assertThat(result.getContent().getFirst().rawPayload())
				.containsEntry("futureField", "preserved");
		verify(repository).findBySggCodeAndDealYearAndDealMonth(
				"11110", 2026, 7, pageable);
	}
}
