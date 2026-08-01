package com.spaceup.domain.rental.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.rental.entity.RentalTransaction;
import com.spaceup.domain.rental.repository.RentalTransactionRepository;

@ExtendWith(MockitoExtension.class)
class RentalTransactionWriterTest {

	@Mock
	private RentalTransactionRepository repository;

	@Test
	void returnsDuplicateWithoutSavingWhenSourceKeyExists() {
		RentalTransaction transaction = transaction();
		when(repository.existsBySourceKey(transaction.getSourceKey())).thenReturn(true);
		RentalTransactionWriter writer = new RentalTransactionWriter(repository);

		InsertResult result = writer.insertIfAbsent(transaction);

		assertThat(result).isEqualTo(InsertResult.DUPLICATE);
		verify(repository, never()).saveAndFlush(transaction);
	}

	@Test
	void flushesNewTransactionBeforeReturningInserted() {
		RentalTransaction transaction = transaction();
		when(repository.existsBySourceKey(transaction.getSourceKey())).thenReturn(false);
		RentalTransactionWriter writer = new RentalTransactionWriter(repository);

		InsertResult result = writer.insertIfAbsent(transaction);

		assertThat(result).isEqualTo(InsertResult.INSERTED);
		verify(repository).saveAndFlush(transaction);
	}

	private RentalTransaction transaction() {
		return RentalTransaction.builder()
				.sourceKey("a".repeat(64))
				.rawPayload(Map.of("aptNm", "테스트아파트"))
				.build();
	}
}
