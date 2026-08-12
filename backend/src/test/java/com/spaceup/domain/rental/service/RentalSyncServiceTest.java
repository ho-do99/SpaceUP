package com.spaceup.domain.rental.service;

import static com.spaceup.domain.rental.service.InsertResult.DUPLICATE;
import static com.spaceup.domain.rental.service.InsertResult.INSERTED;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import com.spaceup.domain.rental.client.MolitRentalClient;
import com.spaceup.domain.rental.client.MolitRentalItem;
import com.spaceup.domain.rental.client.MolitRentalPage;
import com.spaceup.domain.rental.dto.RentalSyncResponse;
import com.spaceup.domain.rental.entity.RentalSyncStatus;
import com.spaceup.domain.rental.entity.RentalTransaction;
import com.spaceup.domain.rental.exception.RentalApiConfigurationException;
import com.spaceup.domain.rental.exception.RentalApiException;

@ExtendWith(MockitoExtension.class)
class RentalSyncServiceTest {

	private static final YearMonth DEAL_YM = YearMonth.of(2026, 7);
	private static final long LOG_ID = 42L;

	@Mock
	private MolitRentalClient client;
	@Mock
	private RentalTransactionMapper mapper;
	@Mock
	private RentalTransactionWriter writer;
	@Mock
	private RentalSyncLogService logService;

	private RentalSyncService service;

	@BeforeEach
	void setUp() {
		service = new RentalSyncService(client, mapper, writer, logService);
		when(logService.start("11110", "202607")).thenReturn(LOG_ID);
	}

	@Test
	void fetchesUntilTotalCountAndAggregatesInsertResults() {
		stubMappedTransaction();
		when(client.fetchPage("11110", DEAL_YM, 1))
				.thenReturn(page(1, 3, item("A"), item("B")));
		when(client.fetchPage("11110", DEAL_YM, 2))
				.thenReturn(page(2, 3, item("C")));
		when(writer.insertIfAbsent(any())).thenReturn(INSERTED, DUPLICATE, INSERTED);

		RentalSyncResponse response = service.sync("11110", DEAL_YM);

		assertThat(response.receivedCount()).isEqualTo(3);
		assertThat(response.insertedCount()).isEqualTo(2);
		assertThat(response.duplicateCount()).isEqualTo(1);
		assertThat(response.status()).isEqualTo(RentalSyncStatus.SUCCESS);
		verify(client).fetchPage("11110", DEAL_YM, 2);
		verify(logService).complete(LOG_ID, 3, 3, 2, 1, 0);
	}

	@Test
	void countsConcurrentUniqueKeyConflictAsDuplicate() {
		stubMappedTransaction();
		when(client.fetchPage("11110", DEAL_YM, 1))
				.thenReturn(page(1, 1, item("A")));
		when(writer.insertIfAbsent(any()))
				.thenThrow(new DataIntegrityViolationException("unique source key"));

		RentalSyncResponse response = service.sync("11110", DEAL_YM);

		assertThat(response.insertedCount()).isZero();
		assertThat(response.duplicateCount()).isEqualTo(1);
		assertThat(response.failedCount()).isZero();
		verify(logService).complete(LOG_ID, 1, 1, 0, 1, 0);
	}

	@Test
	void recordsFailedItemAndContinuesWithLaterItems() {
		when(client.fetchPage("11110", DEAL_YM, 1))
				.thenReturn(page(1, 2, item("A"), item("B")));
		when(mapper.map(any()))
				.thenThrow(new NumberFormatException("잘못된 금액"))
				.thenReturn(RentalTransaction.builder()
						.sourceKey("b".repeat(64))
						.rawPayload(Map.of())
						.build());
		when(writer.insertIfAbsent(any())).thenReturn(INSERTED);

		RentalSyncResponse response = service.sync("11110", DEAL_YM);

		assertThat(response.receivedCount()).isEqualTo(2);
		assertThat(response.insertedCount()).isEqualTo(1);
		assertThat(response.failedCount()).isEqualTo(1);
		assertThat(response.status()).isEqualTo(RentalSyncStatus.PARTIAL_SUCCESS);
		verify(logService).complete(LOG_ID, 2, 2, 1, 0, 1);
	}

	@Test
	void rejectsEmptyPageBeforeReachingTotalCount() {
		when(client.fetchPage("11110", DEAL_YM, 1))
				.thenReturn(page(1, 1));

		assertThatThrownBy(() -> service.sync("11110", DEAL_YM))
				.isInstanceOf(RentalApiException.class)
				.hasMessageContaining("빈 페이지");

		verify(logService).failure(LOG_ID, RentalSyncStatus.FAILED,
				1, 0, 0, 0, 0, "MOLIT_API_ERROR",
				"전체 건수에 도달하기 전에 빈 페이지를 받았습니다.");
	}

	@Test
	void recordsFailedWhenFirstPageCallFails() {
		when(client.fetchPage("11110", DEAL_YM, 1))
				.thenThrow(new RentalApiException("외부 API 호출 실패"));

		assertThatThrownBy(() -> service.sync("11110", DEAL_YM))
				.isInstanceOf(RentalApiException.class);

		verify(logService).failure(LOG_ID, RentalSyncStatus.FAILED,
				0, 0, 0, 0, 0, "MOLIT_API_ERROR", "외부 API 호출 실패");
	}

	@Test
	void recordsConfigurationFailureBeforeAnyItemIsReceived() {
		when(client.fetchPage("11110", DEAL_YM, 1))
				.thenThrow(new RentalApiConfigurationException("키 미설정"));

		assertThatThrownBy(() -> service.sync("11110", DEAL_YM))
				.isInstanceOf(RentalApiConfigurationException.class);

		verify(logService).failure(LOG_ID, RentalSyncStatus.FAILED,
				0, 0, 0, 0, 0, "MOLIT_CONFIG_ERROR", "키 미설정");
	}

	@Test
	void recordsPartialSuccessWhenLaterPageCallFails() {
		stubMappedTransaction();
		when(client.fetchPage("11110", DEAL_YM, 1))
				.thenReturn(page(1, 2, item("A")));
		when(client.fetchPage("11110", DEAL_YM, 2))
				.thenThrow(new RentalApiException("두 번째 페이지 실패"));
		when(writer.insertIfAbsent(any())).thenReturn(INSERTED);

		assertThatThrownBy(() -> service.sync("11110", DEAL_YM))
				.isInstanceOf(RentalApiException.class);

		verify(logService).failure(LOG_ID, RentalSyncStatus.PARTIAL_SUCCESS,
				2, 1, 1, 0, 0, "MOLIT_API_ERROR", "두 번째 페이지 실패");
	}

	private MolitRentalItem item(String apartmentName) {
		return new MolitRentalItem(Map.of("aptNm", apartmentName));
	}

	private void stubMappedTransaction() {
		when(mapper.map(any())).thenReturn(RentalTransaction.builder()
				.sourceKey("a".repeat(64))
				.rawPayload(Map.of())
				.build());
	}

	private MolitRentalPage page(int pageNo, int totalCount, MolitRentalItem... items) {
		return new MolitRentalPage(pageNo, Math.max(items.length, 1), totalCount, List.of(items));
	}
}
