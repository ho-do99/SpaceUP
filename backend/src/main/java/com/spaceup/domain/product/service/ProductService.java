package com.spaceup.domain.product.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.product.dto.ProductCreateRequest;
import com.spaceup.domain.product.dto.ProductResponse;
import com.spaceup.domain.product.entity.Product;
import com.spaceup.domain.product.entity.ProductCategory;
import com.spaceup.domain.product.entity.ProductStatus;
import com.spaceup.domain.product.repository.ProductRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.ProductNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

	private final ProductRepository productRepository;
	private final MemberRepository memberRepository;

	// ⭐ PDF "자재 등록" 화면의 "변경사항 저장" 버튼 (신규 등록)
	@Transactional
	public Long register(Long vendorId, ProductCreateRequest dto) {
		Member vendor = memberRepository.findById(vendorId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + vendorId));

		boolean hasManualCode = dto.getProductCode() != null && !dto.getProductCode().isBlank();

		Product product = Product.builder().vendor(vendor).productCode(hasManualCode ? dto.getProductCode() : null)
				.name(dto.getName()).category(dto.getCategory()).spec(dto.getSpec()).color(dto.getColor())
				.supplyPrice(dto.getSupplyPrice()).salePrice(dto.getSalePrice()).minOrderQty(dto.getMinOrderQty())
				.stockQty(dto.getStockQty()).manufacturer(dto.getManufacturer()).brand(dto.getBrand())
				.imageUrl(dto.getImageUrl()).unit(dto.getUnit()).coverageM2(dto.getCoverageM2())
				.status(dto.getStockQty() != null && dto.getStockQty() > 0 ? ProductStatus.ON_SALE
						: ProductStatus.SOLD_OUT)
				.build();

		productRepository.save(product);
		// ⭐ 브랜드 자체 코드가 없을 때만 DB id 기반으로 자동 채번 (count()+1 대신이라 동시 등록에도 안전)
		if (!hasManualCode) {
			product.assignCode(generateProductCode(product.getId()));
		}
		return product.getId();
	}

	// ⭐ PDF "자재 등록/수정" 화면에서 기존 상품 수정 - 등록한 자재업체 본인만 가능
	@Transactional
	public void update(Long productId, Long vendorId, ProductCreateRequest dto) {
		Product product = findProductOrThrow(productId);
		validateOwnership(product, vendorId);
		product.updateInfo(dto.getName(), dto.getSpec(), dto.getColor(), dto.getSupplyPrice(), dto.getSalePrice(),
				dto.getMinOrderQty(), dto.getManufacturer(), dto.getBrand(), dto.getImageUrl(), dto.getUnit(),
				dto.getCoverageM2());
	}

	// ⭐ PDF "재고 관리" 화면의 "재고 조정" / "입고 등록" 버튼 (delta가 양수면 입고, 음수면 출고/조정) - 본인 상품만
	@Transactional
	public void adjustStock(Long productId, Long vendorId, int delta) {
		Product product = findProductOrThrow(productId);
		validateOwnership(product, vendorId);
		product.updateStock(delta);
	}

	// ⭐ PDF "자재 상품 관리" 화면의 상태 필터(판매중/품절/판매중지) 변경 - 본인 상품만
	@Transactional
	public void changeStatus(Long productId, Long vendorId, ProductStatus status) {
		Product product = findProductOrThrow(productId);
		validateOwnership(product, vendorId);
		product.changeStatus(status);
	}

	public ProductResponse getProduct(Long productId) {
		return new ProductResponse(findProductOrThrow(productId));
	}

	// ⭐ PDF "자재 상품 관리" 목록 (자재업체 로그인 기준 - 본인이 등록한 상품만, 페이지네이션)
	public Page<ProductResponse> getProductsByVendor(Long vendorId, Pageable pageable) {
		return productRepository.findByVendorId(vendorId, pageable).map(ProductResponse::new);
	}

	// ⭐ [프론트 연동] 일반 사용자(임대인)용 상품 목록 조회 - 벤더 구분 없이 전체 상품, 판매중지 상품은 제외.
	// category가 null이면 전체 카테고리를 조회합니다.
	public Page<ProductResponse> getProducts(ProductCategory category, Pageable pageable) {
		Page<Product> products = category != null
				? productRepository.findByCategoryAndStatusNot(category, ProductStatus.SUSPENDED, pageable)
				: productRepository.findByStatusNot(ProductStatus.SUSPENDED, pageable);
		return products.map(ProductResponse::new);
	}

	private Product findProductOrThrow(Long productId) {
		return productRepository.findById(productId)
				.orElseThrow(() -> new ProductNotFoundException("존재하지 않는 상품입니다: " + productId));
	}

	private void validateOwnership(Product product, Long vendorId) {
		if (!product.getVendor().getId().equals(vendorId)) {
			throw new ForbiddenAccessException("본인이 등록한 상품만 처리할 수 있습니다.");
		}
	}

	// ⭐ "PRD-260715-000042" 형식: 브랜드 자체 코드 미입력 시 DB id 기반으로 자동 채번
	private String generateProductCode(Long id) {
		String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
		return String.format("PRD-%s-%06d", datePart, id);
	}
}
