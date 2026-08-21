package com.spaceup.domain.quote.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import com.spaceup.domain.quote.entity.ContractorQuote;
import com.spaceup.domain.quote.entity.QuotePhase;
import com.spaceup.domain.quote.entity.QuoteStatus;

import lombok.Getter;

@Getter
public class ContractorQuoteResponse {
	private final Long id;
	private final Long requestId;
	private final Long contractorId;
	private final String contractorName;
	private final String title;
	private final String startDate;
	private final Integer durationDays;
	private final BigDecimal floorAreaM2;
	private final BigDecimal wallpaperAreaM2;
	private final Integer lightingQuantity;
	private final BigDecimal ceilingHeightM;
	private final Integer roomCount;
	private final Integer bathroomCount;
	private final String siteCondition;
	private final Long materialCost;
	private final Long laborCost;
	private final Long vat;
	private final Long discount;
	private final String detailContent;
	private final Long totalAmount;
	private final QuoteStatus status;
	private final QuotePhase phase;
	private final LocalDate validUntil;
	private final String revisionRequestNote;
	private final List<Long> revisionTargetItemIds;
	private final Long revisionRequestedAmount;
	private final Integer revisionCount;
	private final LocalDateTime createdAt;
	private final List<ItemView> items;

	public ContractorQuoteResponse(ContractorQuote quote) {
		this.id = quote.getId();
		this.requestId = quote.getRequest().getId();
		this.contractorId = quote.getContractor().getId();
		this.contractorName = quote.getContractor().getName();
		this.title = quote.getTitle();
		this.startDate = quote.getStartDate();
		this.durationDays = quote.getDurationDays();
		this.floorAreaM2 = quote.getFloorAreaM2();
		this.wallpaperAreaM2 = quote.getWallpaperAreaM2();
		this.lightingQuantity = quote.getLightingQuantity();
		this.ceilingHeightM = quote.getCeilingHeightM();
		this.roomCount = quote.getRoomCount();
		this.bathroomCount = quote.getBathroomCount();
		this.siteCondition = quote.getSiteCondition();
		this.materialCost = quote.getMaterialCost();
		this.laborCost = quote.getLaborCost();
		this.vat = quote.getVat();
		this.discount = quote.getDiscount();
		this.detailContent = quote.getDetailContent();
		this.totalAmount = quote.getTotalAmount();
		this.status = quote.getStatus();
		this.phase = quote.getPhase();
		this.validUntil = quote.getValidUntil();
		this.revisionRequestNote = quote.getRevisionRequestNote();
		this.revisionTargetItemIds = quote.getRevisionTargetItemIds() == null
				|| quote.getRevisionTargetItemIds().isBlank() ? List.of()
						: Arrays.stream(quote.getRevisionTargetItemIds().split(",")).map(Long::valueOf)
								.collect(Collectors.toList());
		this.revisionRequestedAmount = quote.getRevisionRequestedAmount();
		this.revisionCount = quote.getRevisionCount();
		this.createdAt = quote.getCreatedAt();
		this.items = quote.getItems().stream()
				.map(item -> new ItemView(item.getCategory(), item.getDescription(), item.getQuantity(),
						item.getMeasurementUnit(), item.getUnitPrice(), item.getAmount()))
				.collect(Collectors.toList());
	}

	public record ItemView(String category, String description, BigDecimal quantity, String measurementUnit,
			Long unitPrice, Long amount) {
	}
}
