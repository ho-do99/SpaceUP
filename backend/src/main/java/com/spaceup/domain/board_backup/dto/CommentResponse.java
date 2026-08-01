package com.spaceup.domain.board_backup.dto;

import java.time.LocalDateTime;

import com.spaceup.domain.board_backup.entity.Comment;

import lombok.Getter;

@Getter
public class CommentResponse {
	private final Long id;
	private final String content;
	private final String writerName;
	private final LocalDateTime createdAt;

	public CommentResponse(Comment comment) {
		this.id = comment.getId();
		this.content = comment.getContent();
		this.writerName = comment.getMember().getName();
		this.createdAt = comment.getCreatedAt();
	}
}