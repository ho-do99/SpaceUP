package com.spaceup.domain.product.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.product.entity.Product;
import com.spaceup.domain.product.entity.ProductCategory;
import com.spaceup.domain.product.entity.ProductStatus;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

	Page<Product> findByVendorId(Long vendorId, Pageable pageable);

	// ⭐ [프론트 연동] 일반 사용자(임대인)용 상품 목록 조회 - 판매중지(SUSPENDED) 상품은 목록에서 제외합니다.
	Page<Product> findByStatusNot(ProductStatus status, Pageable pageable);

	Page<Product> findByCategoryAndStatusNot(ProductCategory category, ProductStatus status, Pageable pageable);

	// ⭐ [추천 상품] AnalysisJob 기반 규칙 추천에서 카테고리별 상위 N개를 가격순으로 뽑을 때 사용
	Page<Product> findByCategoryAndStatusOrderBySalePriceAsc(ProductCategory category, ProductStatus status,
			Pageable pageable);
}
