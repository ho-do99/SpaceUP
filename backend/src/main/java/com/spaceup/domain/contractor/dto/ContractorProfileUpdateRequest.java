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
	private String companyName;
	private String activityRegions; // "광주 북구,광주 서구" 형태로 콤마 구분해 전달
	private String specialties; // "도배,바닥재,조명"
	private String portfolioUrl;
	private String introduction;
}
