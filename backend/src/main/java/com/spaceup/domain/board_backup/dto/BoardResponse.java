package com.spaceup.domain.board_backup.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.spaceup.domain.board_backup.entity.Board;
import com.spaceup.domain.board_backup.entity.UploadFile;

import lombok.Getter;

@Getter
public class BoardResponse {
	private final Long id;
	private final String title;
	private final String content;
	private final String boardType;
	private final int viewCount;
	private final String writerName;
	private final LocalDateTime createdAt;
	private final List<UploadFileResponse> files;

	// 상세 조회용 - 첨부파일 목록 포함
	public BoardResponse(Board board, List<UploadFile> uploadFiles) {
		this.id = board.getId();
		this.title = board.getTitle();
		this.content = board.getContent();
		this.boardType = board.getBoardType();
		this.viewCount = board.getViewCount();
		this.writerName = board.getMember().getName();
		this.createdAt = board.getCreatedAt();
		this.files = uploadFiles.stream().map(UploadFileResponse::new).toList();
	}

	// 목록 조회용 - 첨부파일 목록 없이 가벼운 버전
	public BoardResponse(Board board) {
		this(board, List.of());
	}
}