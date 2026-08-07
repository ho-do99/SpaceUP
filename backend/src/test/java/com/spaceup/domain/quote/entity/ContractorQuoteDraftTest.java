package com.spaceup.domain.quote.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.spaceup.global.error.InvalidStatusTransitionException;

class ContractorQuoteDraftTest {

	@Test
	void draftCanBeUpdatedWithoutCreatingAnotherQuote() {
		ContractorQuote quote = ContractorQuote.builder().status(QuoteStatus.DRAFT).build();
		ContractorQuoteItem item = ContractorQuoteItem.builder().category("바닥").description("강마루")
				.amount(1_000_000L).build();

		quote.updateDraft("수정 견적", "2026-09-01", 7, 1_000_000L, 500_000L,
				150_000L, 50_000L, "현장 확인 완료", List.of(item));

		assertEquals("수정 견적", quote.getTitle());
		assertEquals(1, quote.getItems().size());
		assertEquals(1_600_000L, quote.getTotalAmount());
	}

	@Test
	void submittedQuoteCannotBeEditedAsDraft() {
		ContractorQuote quote = ContractorQuote.builder().status(QuoteStatus.SUBMITTED).build();
		assertThrows(InvalidStatusTransitionException.class, () -> quote.updateDraft(
				"수정", null, null, 0L, 0L, 0L, 0L, null, List.of()));
	}
}
