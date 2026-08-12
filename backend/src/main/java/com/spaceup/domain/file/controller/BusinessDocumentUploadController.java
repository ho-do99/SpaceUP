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

import com.spaceup.domain.file.dto.FileUploadResponse;
import com.spaceup.domain.file.service.ImageStoreService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] 시공사 회원가입 화면의 사업자등록증 업로드. 계정이 아직 없는 시점(JWT 없이 호출)이라
// 별도 공개 API로 분리했습니다. JPG/PNG/PDF, 최대 10MB. 응답 fileUrl을 그대로 회원가입 온보딩(PUT
// /api/contractors/me)의 businessRegistrationCertificateUrl 필드에 넣어 저장하면 됩니다.
@RestController
@RequestMapping("/api/files/business-documents")
@RequiredArgsConstructor
public class BusinessDocumentUploadController {

	private final ImageStoreService imageStoreService;

	@PostMapping
	public ResponseEntity<ApiResponse<FileUploadResponse>> upload(@RequestParam("file") MultipartFile file) {
		String storeFileName = imageStoreService.storeBusinessDocument(file);
		String fileUrl = "/api/files/business-documents/" + storeFileName;
		return ResponseEntity.ok(ApiResponse.success("파일이 업로드되었습니다.", new FileUploadResponse(fileUrl)));
	}

	@GetMapping("/{storeFileName}")
	public ResponseEntity<Resource> getDocument(@PathVariable String storeFileName) {
		Resource resource = imageStoreService.loadBusinessDocumentAsResource(storeFileName);
		return ResponseEntity.ok().contentType(resolveMediaType(storeFileName)).body(resource);
	}

	private MediaType resolveMediaType(String fileName) {
		String lower = fileName.toLowerCase();
		if (lower.endsWith(".png")) {
			return MediaType.IMAGE_PNG;
		}
		if (lower.endsWith(".pdf")) {
			return MediaType.APPLICATION_PDF;
		}
		return MediaType.IMAGE_JPEG;
	}
}
