package com.spaceup.domain.rental.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RentalApiSyncLogTest {

	@Test
	void startsInRunningStateWithZeroCounts() {
		RentalApiSyncLog log = RentalApiSyncLog.start("11110", "202607");

		assertThat(log.getLawdCd()).isEqualTo("11110");
		assertThat(log.getDealYm()).isEqualTo("202607");
		assertThat(log.getStatus()).isEqualTo(RentalSyncStatus.RUNNING);
		assertThat(log.getStartedAt()).isNotNull();
		assertThat(log.getReceivedCount()).isZero();
		assertThat(log.getFinishedAt()).isNull();
	}

	@Test
	void completesAsSuccessWhenEveryItemWasStoredOrDuplicated() {
		RentalApiSyncLog log = RentalApiSyncLog.start("11110", "202607");

		log.complete(3, 3, 2, 1, 0);

		assertThat(log.getStatus()).isEqualTo(RentalSyncStatus.SUCCESS);
		assertThat(log.getApiTotalCount()).isEqualTo(3);
		assertThat(log.getInsertedCount()).isEqualTo(2);
		assertThat(log.getDuplicateCount()).isEqualTo(1);
		assertThat(log.getFinishedAt()).isNotNull();
	}

	@Test
	void completesAsPartialSuccessWhenAnItemFailed() {
		RentalApiSyncLog log = RentalApiSyncLog.start("11110", "202607");

		log.complete(3, 3, 2, 0, 1);

		assertThat(log.getStatus()).isEqualTo(RentalSyncStatus.PARTIAL_SUCCESS);
		assertThat(log.getFailedCount()).isEqualTo(1);
	}

	@Test
	void recordsTerminalFailureDetails() {
		RentalApiSyncLog log = RentalApiSyncLog.start("11110", "202607");

		log.fail(RentalSyncStatus.FAILED, 0, 0, 0, 0, 0,
				"MOLIT_API_ERROR", "외부 API 호출 실패");

		assertThat(log.getStatus()).isEqualTo(RentalSyncStatus.FAILED);
		assertThat(log.getErrorCode()).isEqualTo("MOLIT_API_ERROR");
		assertThat(log.getErrorMessage()).isEqualTo("외부 API 호출 실패");
		assertThat(log.getFinishedAt()).isNotNull();
	}
}
