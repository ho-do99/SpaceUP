package com.spaceup.domain.rental.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.rental.entity.RentalApiSyncLog;
import com.spaceup.domain.rental.entity.RentalSyncStatus;
import com.spaceup.domain.rental.repository.RentalApiSyncLogRepository;

@ExtendWith(MockitoExtension.class)
class RentalSyncLogServiceTest {

	@Mock
	private RentalApiSyncLogRepository repository;

	@Test
	void startsAndReturnsPersistedLogId() {
		RentalApiSyncLog saved = org.mockito.Mockito.mock(RentalApiSyncLog.class);
		when(saved.getId()).thenReturn(42L);
		when(repository.save(any(RentalApiSyncLog.class))).thenReturn(saved);
		RentalSyncLogService service = new RentalSyncLogService(repository);

		assertThat(service.start("11110", "202607")).isEqualTo(42L);
	}

	@Test
	void completesStoredLog() {
		RentalApiSyncLog log = org.mockito.Mockito.mock(RentalApiSyncLog.class);
		when(repository.findById(42L)).thenReturn(Optional.of(log));
		RentalSyncLogService service = new RentalSyncLogService(repository);

		service.complete(42L, 3, 3, 2, 1, 0);

		verify(log).complete(3, 3, 2, 1, 0);
	}

	@Test
	void truncatesFailureMessageToDatabaseLimit() {
		RentalApiSyncLog log = org.mockito.Mockito.mock(RentalApiSyncLog.class);
		when(repository.findById(42L)).thenReturn(Optional.of(log));
		RentalSyncLogService service = new RentalSyncLogService(repository);
		ArgumentCaptor<String> message = ArgumentCaptor.forClass(String.class);

		service.failure(42L, RentalSyncStatus.FAILED,
				0, 0, 0, 0, 0, "MOLIT_API_ERROR", "가".repeat(700));

		verify(log).fail(
				org.mockito.ArgumentMatchers.eq(RentalSyncStatus.FAILED),
				org.mockito.ArgumentMatchers.eq(0),
				org.mockito.ArgumentMatchers.eq(0),
				org.mockito.ArgumentMatchers.eq(0),
				org.mockito.ArgumentMatchers.eq(0),
				org.mockito.ArgumentMatchers.eq(0),
				org.mockito.ArgumentMatchers.eq("MOLIT_API_ERROR"),
				message.capture());
		assertThat(message.getValue()).hasSize(500);
	}
}
