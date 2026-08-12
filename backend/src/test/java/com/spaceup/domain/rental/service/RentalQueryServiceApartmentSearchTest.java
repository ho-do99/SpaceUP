package com.spaceup.domain.rental.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import com.spaceup.domain.rental.dto.RentalApartmentSearchResponse;
import com.spaceup.domain.rental.entity.RentalTransaction;
import com.spaceup.domain.rental.repository.RentalTransactionRepository;

@ExtendWith(MockitoExtension.class)
class RentalQueryServiceApartmentSearchTest {

	@Mock
	private RentalTransactionRepository repository;

	private RentalQueryService service;

	@Test
	void deduplicatesByApartmentNameAndExclusiveArea() {
		service = new RentalQueryService(repository);

		// 같은 아파트("스페이스업아파트", 84.0㎡)가 3건 거래 기록으로 중복 존재, 다른 면적(59.0㎡) 1건은 별도 그룹
		RentalTransaction tx1 = transaction(1L, "스페이스업아파트", "84", "도로1");
		RentalTransaction tx2 = transaction(2L, "스페이스업아파트", "84", "도로2");
		RentalTransaction tx3 = transaction(3L, "스페이스업아파트", "84", "도로3");
		RentalTransaction tx4 = transaction(4L, "스페이스업아파트", "59", "도로4");

		when(repository.searchForApartments(any(), any())).thenReturn(List.of(tx1, tx2, tx3, tx4));

		Page<RentalApartmentSearchResponse> result = service.searchApartments(null, null, PageRequest.of(0, 20));

		assertThat(result.getTotalElements()).isEqualTo(2);
		assertThat(result.getContent()).extracting(RentalApartmentSearchResponse::exclusiveAreaM2)
				.containsExactlyInAnyOrder(new BigDecimal("84"), new BigDecimal("59"));
	}

	@Test
	void paginatesDeduplicatedResults() {
		service = new RentalQueryService(repository);

		List<RentalTransaction> transactions = List.of(transaction(1L, "A아파트", "59", "로드A"),
				transaction(2L, "B아파트", "59", "로드B"), transaction(3L, "C아파트", "59", "로드C"));
		when(repository.searchForApartments(any(), any())).thenReturn(transactions);

		Page<RentalApartmentSearchResponse> page0 = service.searchApartments(null, null, PageRequest.of(0, 2));
		assertThat(page0.getContent()).hasSize(2);
		assertThat(page0.getTotalElements()).isEqualTo(3);

		Page<RentalApartmentSearchResponse> page1 = service.searchApartments(null, null, PageRequest.of(1, 2));
		assertThat(page1.getContent()).hasSize(1);
	}

	private RentalTransaction transaction(Long id, String apartmentName, String exclusiveArea, String roadName) {
		return RentalTransaction.builder().id(id).apartmentName(apartmentName)
				.exclusiveUseArea(new BigDecimal(exclusiveArea)).roadName(roadName).umdName("동")
				.rawPayload(Map.of()).build();
	}
}
