package com.spaceup.domain.board_backup.dto;

import com.spaceup.domain.board_backup.entity.UploadFile;

import lombok.Getter;

@Getter
public class UploadFileResponse {
	private final Long id;
	private final String uploadFileName;
	private final Long fileSize;

	public UploadFileResponse(UploadFile uploadFile) {
		this.id = uploadFile.getId();
		this.uploadFileName = uploadFile.getUploadFileName();
		this.fileSize = uploadFile.getFileSize();
	}
}