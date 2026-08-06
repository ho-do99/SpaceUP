package com.spaceup.domain.file.service;

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

import com.spaceup.global.error.FileNotFoundException;

// ⭐ [프론트 연동] "집 사진"/포트폴리오 이미지 업로드용 범용 스토리지. 게시판(FileStoreService)은 Board에
// 종속돼(board_id FK nullable=false) 재사용이 안 되고, 지금은 DB 기록이 필요한 도메인도 없어서(Property/
// Portfolio는 문자열 imageUrl만 받음) 파일시스템에 저장 + URL만 반환하는 무상태 방식으로 분리했습니다.
// 운영 반영 시에는 로컬 디스크 대신 S3 등 객체 스토리지로 교체하는 걸 권장합니다(아래 참고 사항 확인).
@Service
public class ImageStoreService {

	@Value("${file.upload-dir}")
	private String uploadDir;

	public String store(MultipartFile multipartFile) {
		if (multipartFile == null || multipartFile.isEmpty()) {
			throw new IllegalArgumentException("업로드할 이미지 파일이 없습니다.");
		}
		String contentType = multipartFile.getContentType();
		if (contentType == null || !contentType.startsWith("image/")) {
			throw new IllegalArgumentException("이미지 파일만 업로드할 수 있습니다.");
		}

		// ⭐ MultipartFile.transferTo()는 상대 경로를 넘기면 Tomcat의 임시 멀티파트 디렉터리를 기준으로
		// 해석해버려서(우리 앱의 실제 작업 디렉터리가 아님) 파일을 못 찾는 오류가 납니다. 절대 경로로 변환해서 넘겨야 합니다.
		File dir = new File(uploadDir).getAbsoluteFile();
		if (!dir.exists()) {
			dir.mkdirs();
		}

		String originalFilename = multipartFile.getOriginalFilename();
		String extension = (originalFilename != null && originalFilename.contains("."))
				? originalFilename.substring(originalFilename.lastIndexOf("."))
				: "";
		String storeFileName = UUID.randomUUID() + extension;

		try {
			multipartFile.transferTo(new File(dir, storeFileName));
		} catch (IOException e) {
			throw new IllegalStateException("이미지 저장 중 오류가 발생했습니다.", e);
		}
		return storeFileName;
	}

	// ⭐ [AI 인테리어 이미지 생성] Gemini 등 외부 생성 API가 돌려준 바이트 배열을 업로드 이미지와 동일한
	// 저장소/서빙 경로(GET /api/files/images/{storeFileName})로 저장하기 위한 용도
	public String storeBytes(byte[] data, String extension) {
		File dir = new File(uploadDir).getAbsoluteFile();
		if (!dir.exists()) {
			dir.mkdirs();
		}
		String storeFileName = UUID.randomUUID() + extension;
		try {
			java.nio.file.Files.write(new File(dir, storeFileName).toPath(), data);
		} catch (IOException e) {
			throw new IllegalStateException("이미지 저장 중 오류가 발생했습니다.", e);
		}
		return storeFileName;
	}

	public Resource loadAsResource(String storeFileName) {
		try {
			Path baseDir = Paths.get(uploadDir).toAbsolutePath().normalize();
			Path filePath = baseDir.resolve(storeFileName).normalize();
			if (!filePath.startsWith(baseDir)) {
				throw new FileNotFoundException("잘못된 파일 경로입니다: " + storeFileName);
			}
			Resource resource = new UrlResource(filePath.toUri());
			if (resource.exists() && resource.isReadable()) {
				return resource;
			}
			throw new FileNotFoundException("파일을 읽을 수 없습니다: " + storeFileName);
		} catch (MalformedURLException e) {
			throw new FileNotFoundException("파일 경로가 올바르지 않습니다: " + storeFileName);
		}
	}
}
