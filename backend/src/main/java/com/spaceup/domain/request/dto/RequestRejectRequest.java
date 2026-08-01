package com.spaceup.domain.request.dto;

import com.spaceup.domain.request.entity.RejectReason;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// ⭐ [Figma 반영] "의뢰 거절 사유" 선택 화면의 입력값
@Getter
@Setter
@NoArgsConstructor
public class RequestRejectRequest {

	@NotNull(message = "거절 사유를 선택해 주세요.")
	private RejectReason reason;

	// reason=OTHER일 때만 사용하는 상세 사유
	private String detail;
}
