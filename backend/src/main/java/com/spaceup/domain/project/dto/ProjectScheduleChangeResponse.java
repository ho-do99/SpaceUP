package com.spaceup.domain.project.dto;

import java.time.LocalDate;

// ⭐ [프론트 연동] ContractorProjectChangeRequest 대응 - 변경 이력을 별도로 저장하지 않고, 변경 처리 시점에
// 이전 값과 바뀐 값을 함께 응답으로 돌려줍니다 (프론트에서 토스트/안내문구로 바로 사용 가능)
public record ProjectScheduleChangeResponse(
		LocalDate previousStartDate,
		LocalDate previousCompletionDate,
		LocalDate changedStartDate,
		LocalDate changedCompletionDate,
		String reason) {
}
