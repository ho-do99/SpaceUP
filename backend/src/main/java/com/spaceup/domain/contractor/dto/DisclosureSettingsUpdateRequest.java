package com.spaceup.domain.contractor.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [Figma 반영] "업체 공개 설정" 화면 - 6개 토글 일괄 저장
@Getter
@Setter
@NoArgsConstructor
public class DisclosureSettingsUpdateRequest {
	private boolean profilePublic;
	private boolean contactPublic;
	private boolean specialtyPublic;
	private boolean regionPublic;
	private boolean portfolioPublic;
	private boolean availableForConsult;
}
