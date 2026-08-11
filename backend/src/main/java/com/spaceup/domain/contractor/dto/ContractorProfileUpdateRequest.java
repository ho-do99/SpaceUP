package com.spaceup.domain.contractor.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ 최초 등록/수정 공용 DTO (있으면 update, 없으면 create - upsert 방식)
@Getter
@Setter
@NoArgsConstructor
public class ContractorProfileUpdateRequest {

	private String businessRegistrationNumber;
	private String representativeName; // 대표자명
	private String businessRegistrationCertificateUrl; // 사업자등록증 파일 URL (POST /api/files/business-documents 응답값)
	private String companyName;
	private String companyAddress; // 업체 주소
	private String businessAddress; // 사업장 주소
	private Integer constructionExperienceYears; // 시공 경력(년)
	private String activityRegions; // "광주 북구,광주 서구" 형태로 콤마 구분해 전달
	private Integer travelDistanceKm; // 출장 가능 거리(km), 예: 10/30/50
	private String specialties; // "도배,바닥재,조명"
	private String portfolioUrl;
	private String introduction;
}
