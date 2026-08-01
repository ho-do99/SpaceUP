package com.spaceup.domain.file.controller;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.spaceup.domain.file.dto.ImageUploadResponse;
import com.spaceup.domain.file.service.ImageStoreService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] 매물 사진(Property) / 포트폴리오(mainImageUrl, photoUrls) 등에서 공통으로 쓰는 범용 이미지
// 업로드 API. 업로드 후 반환되는 imageUrl을 각 도메인의 문자열 필드에 그대로 저장하면 됩니다.
@RestController
@RequestMapping("/api/files/images")
@RequiredArgsConstructor
public class ImageUploadController {

	private final ImageStoreService imageStoreService;

	@PostMapping
	public ResponseEntity<ApiResponse<ImageUploadResponse>> upload(@RequestParam("file") MultipartFile file) {
		String storeFileName = imageStoreService.store(file);
		String imageUrl = "/api/files/images/" + storeFileName;
		return ResponseEntity.ok(ApiResponse.success("이미지가 업로드되었습니다.", new ImageUploadResponse(imageUrl)));
	}

	@GetMapping("/{storeFileName}")
	public ResponseEntity<Resource> getImage(@PathVariable String storeFileName) {
		Resource resource = imageStoreService.loadAsResource(storeFileName);
		MediaType mediaType = resolveMediaType(storeFileName);
		return ResponseEntity.ok().contentType(mediaType).body(resource);
	}

	private MediaType resolveMediaType(String fileName) {
		String lower = fileName.toLowerCase();
		if (lower.endsWith(".png")) {
			return MediaType.IMAGE_PNG;
		}
		if (lower.endsWith(".gif")) {
			return MediaType.IMAGE_GIF;
		}
		if (lower.endsWith(".webp")) {
			return MediaType.valueOf("image/webp");
		}
		return MediaType.IMAGE_JPEG;
	}
}
