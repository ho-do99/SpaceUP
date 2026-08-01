package com.spaceup.domain.notification.dto;

import java.time.LocalDateTime;

import com.spaceup.domain.notification.entity.Notification;
import com.spaceup.domain.notification.entity.NotificationType;

import lombok.Getter;

@Getter
public class NotificationResponse {
	private final Long id;
	private final NotificationType type;
	private final String title;
	private final String content;
	private final boolean read;
	private final LocalDateTime createdAt;

	public NotificationResponse(Notification notification) {
		this.id = notification.getId();
		this.type = notification.getType();
		this.title = notification.getTitle();
		this.content = notification.getContent();
		this.read = notification.isRead();
		this.createdAt = notification.getCreatedAt();
	}
}
