package com.spaceup.domain.contractor.dto;

import java.time.LocalDate;

import com.spaceup.domain.contractor.entity.ContractorProfile;

import lombok.Getter;

@Getter
public class ContractorProfileResponse {
	private final Long id;
	private final Long memberId;
	private final String memberName;
	private final String businessRegistrationNumber;
	private final String representativeName;
	private final String businessRegistrationCertificateUrl;
	private final String companyName;
	private final String companyAddress;
	private final String businessAddress;
	private final Integer constructionExperienceYears;
	private final String activityRegions;
	private final Integer travelDistanceKm;
	private final String specialties;
	private final String portfolioUrl;
	private final String introduction;
	private final Double rating;
	private final Integer reviewCount;
	private final Integer completedProjectCount;
	private final String managerPosition;
	private final String consultationHours;
	private final boolean profilePublic;
	private final boolean contactPublic;
	private final boolean specialtyPublic;
	private final boolean regionPublic;
	private final boolean portfolioPublic;
	private final boolean availableForConsult;
	private final Long estimateMin;
	private final Long estimateMax;
	private final LocalDate availableFromDate;

	public ContractorProfileResponse(ContractorProfile profile) {
		this.id = profile.getId();
		this.memberId = profile.getMember().getId();
		this.memberName = profile.getMember().getName();
		this.businessRegistrationNumber = profile.getBusinessRegistrationNumber();
		this.representativeName = profile.getRepresentativeName();
		this.businessRegistrationCertificateUrl = profile.getBusinessRegistrationCertificateUrl();
		this.companyName = profile.getCompanyName();
		this.companyAddress = profile.getCompanyAddress();
		this.businessAddress = profile.getBusinessAddress();
		this.constructionExperienceYears = profile.getConstructionExperienceYears();
		this.activityRegions = profile.getActivityRegions();
		this.travelDistanceKm = profile.getTravelDistanceKm();
		this.specialties = profile.getSpecialties();
		this.portfolioUrl = profile.getPortfolioUrl();
		this.introduction = profile.getIntroduction();
		this.rating = profile.getRating();
		this.reviewCount = profile.getReviewCount();
		this.completedProjectCount = profile.getCompletedProjectCount();
		this.managerPosition = profile.getManagerPosition();
		this.consultationHours = profile.getConsultationHours();
		this.profilePublic = profile.isProfilePublic();
		this.contactPublic = profile.isContactPublic();
		this.specialtyPublic = profile.isSpecialtyPublic();
		this.regionPublic = profile.isRegionPublic();
		this.portfolioPublic = profile.isPortfolioPublic();
		this.availableForConsult = profile.isAvailableForConsult();
		this.estimateMin = profile.getEstimateMin();
		this.estimateMax = profile.getEstimateMax();
		this.availableFromDate = profile.getAvailableFromDate();
	}
}
