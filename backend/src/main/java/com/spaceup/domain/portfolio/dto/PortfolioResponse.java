package com.spaceup.domain.portfolio.dto;

import com.spaceup.domain.portfolio.entity.Portfolio;

import lombok.Getter;

@Getter
public class PortfolioResponse {
	private final Long id;
	private final Long contractorId;
	private final String projectName;
	private final String region;
	private final String propertyType;
	private final Double areaM2;
	private final String workItems;
	private final Integer durationDays;
	private final Long amount;
	private final String mainImageUrl;
	private final String photoUrls;
	private final boolean isPublic;

	public PortfolioResponse(Portfolio portfolio) {
		this.id = portfolio.getId();
		this.contractorId = portfolio.getContractor().getId();
		this.projectName = portfolio.getProjectName();
		this.region = portfolio.getRegion();
		this.propertyType = portfolio.getPropertyType();
		this.areaM2 = portfolio.getAreaM2();
		this.workItems = portfolio.getWorkItems();
		this.durationDays = portfolio.getDurationDays();
		this.amount = portfolio.getAmount();
		this.mainImageUrl = portfolio.getMainImageUrl();
		this.photoUrls = portfolio.getPhotoUrls();
		this.isPublic = portfolio.isPublic();
	}
}
