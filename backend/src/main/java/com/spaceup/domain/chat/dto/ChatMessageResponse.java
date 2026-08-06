package com.spaceup.domain.chat.dto;

import java.time.LocalDateTime;

import com.spaceup.domain.chat.entity.ChatMessage;
import com.spaceup.domain.chat.entity.ChatSenderType;

public record ChatMessageResponse(
		Long id,
		ChatSenderType senderType,
		String senderName,
		String content,
		boolean read,
		LocalDateTime createdAt) {

	public ChatMessageResponse(ChatMessage message) {
		this(message.getId(), message.getSenderType(),
				message.getSender() != null ? message.getSender().getName() : "시스템", message.getContent(),
				message.isRead(), message.getCreatedAt());
	}
}
