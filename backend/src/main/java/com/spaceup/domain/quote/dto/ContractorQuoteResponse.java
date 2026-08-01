package com.spaceup.domain.quote.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import com.spaceup.domain.quote.entity.ContractorQuote;
import com.spaceup.domain.quote.entity.QuoteStatus;

import lombok.Getter;

@Getter
public class ContractorQuoteResponse {
	private final Long id;
	private final Long requestId;
	private final Long contractorId;
	private final String title;
	private final String startDate;
	private final Integer durationDays;
	private final Long totalAmount;
	private final QuoteStatus status;
	private final LocalDate validUntil;
	private final String revisionRequestNote;
	private final Integer revisionCount;
	private final List<ItemView> items;

	public ContractorQuoteResponse(ContractorQuote quote) {
		this.id = quote.getId();
		this.requestId = quote.getRequest().getId();
		this.contractorId = quote.getContractor().getId();
		this.title = quote.getTitle();
		this.startDate = quote.getStartDate();
		this.durationDays = quote.getDurationDays();
		this.totalAmount = quote.getTotalAmount();
		this.status = quote.getStatus();
		this.validUntil = quote.getValidUntil();
		this.revisionRequestNote = quote.getRevisionRequestNote();
		this.revisionCount = quote.getRevisionCount();
		this.items = quote.getItems().stream()
				.map(item -> new ItemView(item.getCategory(), item.getDescription(), item.getAmount()))
				.collect(Collectors.toList());
	}

	public record ItemView(String category, String description, Long amount) {
	}
}
