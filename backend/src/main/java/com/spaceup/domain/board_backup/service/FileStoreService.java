package com.spaceup.domain.board_backup.service;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.spaceup.domain.board_backup.entity.Board;
import com.spaceup.domain.board_backup.entity.UploadFile;
import com.spaceup.domain.board_backup.repository.UploadFileRepository;
import com.spaceup.global.error.FileNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FileStoreService {

	private final UploadFileRepository uploadFileRepository;

	@Value("${file.upload-dir}")
	private String uploadDir;

	public UploadFile storeFile(MultipartFile multipartFile, Board board) throws IOException {
		if (multipartFile == null || multipartFile.isEmpty())
			return null;

		File dir = new File(uploadDir);
		if (!dir.exists())
			dir.mkdirs();

		String originalFilename = multipartFile.getOriginalFilename();
		String storeFileName = UUID.randomUUID() + "."
				+ originalFilename.substring(originalFilename.lastIndexOf(".") + 1);
		multipartFile.transferTo(new File(uploadDir + storeFileName));

		UploadFile uploadFile = UploadFile.builder().uploadFileName(originalFilename).storeFileName(storeFileName)
				.fileSize(multipartFile.getSize()).board(board).build();
		return uploadFileRepository.save(uploadFile);
	}

	public UploadFile getFile(Long fileId) {
		return uploadFileRepository.findById(fileId)
				.orElseThrow(() -> new FileNotFoundException("존재하지 않는 파일입니다: " + fileId));
	}

	public Resource loadFileAsResource(UploadFile uploadFile) {
		try {
			Path filePath = Paths.get(uploadDir).resolve(uploadFile.getStoreFileName()).normalize();
			Resource resource = new UrlResource(filePath.toUri());
			if (resource.exists() && resource.isReadable()) {
				return resource;
			} else {
				throw new FileNotFoundException("파일을 읽을 수 없습니다: " + uploadFile.getStoreFileName());
			}
		} catch (MalformedURLException e) {
			throw new FileNotFoundException("파일 경로가 올바르지 않습니다: " + uploadFile.getStoreFileName());
		}
	}
}