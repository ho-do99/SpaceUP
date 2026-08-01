package com.spaceup.domain.contractor.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [Figma 반영] "담당자 정보" 화면 입력값. 담당자명/휴대폰/이메일은 Member 쪽 필드를 그대로 쓰고,
// 여기서는 ContractorProfile에만 있는 직책/상담가능시간만 관리합니다.
@Getter
@Setter
@NoArgsConstructor
public class ManagerInfoUpdateRequest {
	private String managerPosition;
	private String consultationHours;
}
