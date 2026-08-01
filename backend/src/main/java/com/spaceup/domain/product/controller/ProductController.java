package com.spaceup.domain.product.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.domain.product.dto.ProductCreateRequest;
import com.spaceup.domain.product.dto.ProductResponse;
import com.spaceup.domain.product.dto.StockAdjustRequest;
import com.spaceup.domain.product.entity.ProductCategory;
import com.spaceup.domain.product.entity.ProductStatus;
import com.spaceup.domain.product.service.ProductService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

	private final ProductService productService;

	// ⭐ PDF "자재 등록" 화면 (자재업체 로그인 기준)
	@PostMapping
	public ResponseEntity<ApiResponse<Long>> register(@Valid @RequestBody ProductCreateRequest request,
			Authentication authentication) {
		Long vendorId = getMemberId(authentication);
		Long productId = productService.register(vendorId, request);
		return ResponseEntity.ok(ApiResponse.success("상품이 등록되었습니다.", productId));
	}

	// ⭐ PDF "자재 등록/수정" 화면 (등록한 자재업체 본인만)
	@PutMapping("/{productId}")
	public ResponseEntity<ApiResponse<Void>> update(@PathVariable Long productId,
			@Valid @RequestBody ProductCreateRequest request, Authentication authentication) {
		productService.update(productId, getMemberId(authentication), request);
		return ResponseEntity.ok(ApiResponse.success("상품 정보가 수정되었습니다.", null));
	}

	@GetMapping("/{productId}")
	public ResponseEntity<ApiResponse<ProductResponse>> getProduct(@PathVariable Long productId) {
		return ResponseEntity.ok(ApiResponse.success("상품 조회 완료", productService.getProduct(productId)));
	}

	// ⭐ [프론트 연동] 일반 사용자(임대인)용 상품 목록/검색 화면 - 벤더 구분 없이 카테고리 필터 + 페이지네이션
	@GetMapping
	public ResponseEntity<ApiResponse<Page<ProductResponse>>> getProducts(
			@RequestParam(required = false) ProductCategory category, @PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(ApiResponse.success("상품 목록 조회 완료", productService.getProducts(category, pageable)));
	}

	// ⭐ PDF "자재 상품 관리" 목록 화면 (자재업체 로그인 기준 - 본인 상품만, 페이지네이션)
	@GetMapping("/vendor/me")
	public ResponseEntity<ApiResponse<Page<ProductResponse>>> getMyProducts(@PageableDefault(size = 20) Pageable pageable,
			Authentication authentication) {
		Long vendorId = getMemberId(authentication);
		return ResponseEntity.ok(ApiResponse.success("상품 목록 조회 완료", productService.getProductsByVendor(vendorId, pageable)));
	}

	// ⭐ PDF "재고 관리" 화면의 "재고 조정" 버튼 (본인 상품만)
	@PostMapping("/{productId}/stock")
	public ResponseEntity<ApiResponse<Void>> adjustStock(@PathVariable Long productId,
			@Valid @RequestBody StockAdjustRequest request, Authentication authentication) {
		productService.adjustStock(productId, getMemberId(authentication), request.getDelta());
		return ResponseEntity.ok(ApiResponse.success("재고가 조정되었습니다.", null));
	}

	// ⭐ PDF "자재 상품 관리" 화면의 판매중지/재개 버튼 (본인 상품만)
	@PatchMapping("/{productId}/status/{status}")
	public ResponseEntity<ApiResponse<Void>> changeStatus(@PathVariable Long productId,
			@PathVariable ProductStatus status, Authentication authentication) {
		productService.changeStatus(productId, getMemberId(authentication), status);
		return ResponseEntity.ok(ApiResponse.success("상품 상태가 변경되었습니다.", null));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
