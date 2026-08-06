package com.spaceup.domain.product.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.analysis.entity.AnalysisJob;
import com.spaceup.domain.analysis.repository.AnalysisJobRepository;
import com.spaceup.domain.product.dto.RecommendedProductResponse;
import com.spaceup.domain.product.entity.Product;
import com.spaceup.domain.product.entity.ProductCategory;
import com.spaceup.domain.product.entity.ProductStatus;
import com.spaceup.domain.product.repository.ProductRepository;
import com.spaceup.global.error.AnalysisNotFoundException;
import com.spaceup.global.error.ForbiddenAccessException;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "추천 상품(장판/벽지/조명/주방상부장)" 화면. AI 분석 결과(issueTags)를 참고해 카테고리별로
// 판매중인 상품 중 가격 낮은 순으로 각 3개씩 추천합니다.
// ⚠️ 규칙 기반 초기 버전입니다 - Product에 판매량/리뷰 같은 데이터가 없어서 "가격순 + 이슈태그 매칭 사유 +
// 면적 기준 수량" 이상의 정교한 매칭(개인화 등)은 지금 스키마로는 불가능합니다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductRecommendationService {

	private static final int RECOMMENDATION_LIMIT_PER_CATEGORY = 3;

	private final ProductRepository productRepository;
	private final AnalysisJobRepository analysisJobRepository;

	// ⭐ [보안 수정] 의뢰의 임대인 본인 또는 배정된 시공사만 추천 상품을 조회할 수 있습니다.
	public List<RecommendedProductResponse> recommend(Long requestId, Long memberId) {
		AnalysisJob analysis = analysisJobRepository.findByRequestId(requestId)
				.orElseThrow(() -> new AnalysisNotFoundException("해당 의뢰의 분석 결과가 없습니다: " + requestId));
		boolean isOwner = analysis.getRequest().getOwner().getId().equals(memberId);
		boolean isContractor = analysis.getRequest().getContractor() != null
				&& analysis.getRequest().getContractor().getId().equals(memberId);
		if (!isOwner && !isContractor) {
			throw new ForbiddenAccessException("본인이 참여 중인 의뢰의 추천 상품만 조회할 수 있습니다.");
		}

		List<RecommendedProductResponse> result = new ArrayList<>();
		result.addAll(recommendByCategory(ProductCategory.FLOORING, analysis.getIssueTags(),
				analysis.getTotalFloorAreaM2()));
		result.addAll(recommendByCategory(ProductCategory.WALLPAPER, analysis.getIssueTags(),
				analysis.getTotalWallpaperAreaM2()));
		// ⭐ [프론트 연동] 조명/주방 상부장은 면적 기준 수량 계산 대상이 아니라 개수 단위라 relevantAreaM2를 안 넘깁니다.
		result.addAll(recommendByCategory(ProductCategory.LIGHTING, analysis.getIssueTags(), null));
		result.addAll(recommendByCategory(ProductCategory.KITCHEN, analysis.getIssueTags(), null));
		return result;
	}

	private List<RecommendedProductResponse> recommendByCategory(ProductCategory category, String issueTags,
			Double relevantAreaM2) {
		List<Product> products = productRepository
				.findByCategoryAndStatusOrderBySalePriceAsc(category, ProductStatus.ON_SALE,
						PageRequest.of(0, RECOMMENDATION_LIMIT_PER_CATEGORY))
				.getContent();

		String reason = buildReason(category, issueTags);
		List<RecommendedProductResponse> responses = new ArrayList<>();
		int priority = 1;
		for (Product product : products) {
			int quantity = calculateQuantity(product, relevantAreaM2);
			Long unitPrice = product.getSalePrice() != null ? product.getSalePrice() : 0L;
			responses.add(new RecommendedProductResponse(product.getId(), product.getName(), product.getCategory(),
					product.getSpec(), product.getBrand(), product.getVendor().getName(), product.getImageUrl(),
					unitPrice, product.getUnit(), quantity, product.getCoverageM2(), unitPrice * quantity, reason,
					priority++));
		}
		return responses;
	}

	// ⭐ 상품에 면적당 커버리지(coverageM2)가 등록돼 있고 공간 정보(면적)도 있으면 "면적 ÷ 커버리지"로 실제
	// 필요 수량을 계산합니다. 둘 중 하나라도 없으면 예전처럼 최소주문수량(없으면 1)으로 대체합니다.
	private int calculateQuantity(Product product, Double relevantAreaM2) {
		Double coverageM2 = product.getCoverageM2();
		if (relevantAreaM2 != null && relevantAreaM2 > 0 && coverageM2 != null && coverageM2 > 0) {
			return (int) Math.ceil(relevantAreaM2 / coverageM2);
		}
		return product.getMinOrderQty() != null && product.getMinOrderQty() > 0 ? product.getMinOrderQty() : 1;
	}

	private String buildReason(ProductCategory category, String issueTags) {
		boolean matchesIssue = issueTags != null && ((category == ProductCategory.FLOORING
				&& (issueTags.contains("바닥") || issueTags.contains("장판")))
				|| (category == ProductCategory.WALLPAPER && issueTags.contains("벽지"))
				|| (category == ProductCategory.LIGHTING && issueTags.contains("조명"))
				|| (category == ProductCategory.KITCHEN && issueTags.contains("주방")));
		if (matchesIssue) {
			return "AI 분석에서 감지된 이슈(" + issueTags + ")에 대응하는 " + categoryLabel(category) + " 추천 상품입니다.";
		}
		return "판매중인 " + categoryLabel(category) + " 상품 중 합리적인 가격대의 추천 상품입니다.";
	}

	private String categoryLabel(ProductCategory category) {
		return switch (category) {
			case FLOORING -> "바닥재";
			case WALLPAPER -> "벽지";
			case LIGHTING -> "조명";
			case KITCHEN -> "주방 상부장";
			default -> category.name();
		};
	}
}
