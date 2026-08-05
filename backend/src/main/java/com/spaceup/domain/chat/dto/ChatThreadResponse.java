package com.spaceup.domain.chat.dto;

import java.time.LocalDateTime;

import com.spaceup.domain.request.entity.RequestStatus;

// ⭐ [프론트 연동] ContractorChatThread 화면 카드에 대응. counterpartName은 시공사 입장이면 임대인 이름,
// 임대인 입장이면 시공사 이름입니다.
public record ChatThreadResponse(
		Long requestId,
		String requestCode,
		String counterpartName,
		RequestStatus requestStatus,
		String lastMessage,
		LocalDateTime lastMessageAt,
		long unreadCount) {
}
