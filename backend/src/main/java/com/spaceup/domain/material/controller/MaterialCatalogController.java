package com.spaceup.domain.material.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.spaceup.domain.material.dto.MaterialProductResponse;
import com.spaceup.domain.material.entity.MaterialTheme;
import com.spaceup.domain.material.entity.MaterialWorkType;
import com.spaceup.domain.material.service.MaterialCatalogService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/material-products")
@RequiredArgsConstructor
public class MaterialCatalogController {
	private final MaterialCatalogService materialCatalogService;

	@GetMapping
	public ResponseEntity<ApiResponse<List<MaterialProductResponse>>> getProducts(
			@RequestParam(required = false) MaterialTheme theme,
			@RequestParam(required = false) MaterialWorkType workType) {
		return ResponseEntity.ok(ApiResponse.success("자재 카탈로그 조회 완료",
				materialCatalogService.getProducts(theme, workType)));
	}
}
