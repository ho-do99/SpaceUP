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

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "추천 상품(장판/벽지)" 화면. AI 분석 결과(issueTags)를 참고해 바닥재/벽지 카테고리에서
// 판매중인 상품 중 가격 낮은 순으로 각 3개씩 추천합니다.
// ⚠️ 규칙 기반 초기 버전입니다 - Product에 평점/판매량/면적당 소요량 같은 데이터가 없어서 "가격순 + 이슈태그
// 매칭 사유" 이상의 정교한 매칭은 지금 스키마로는 불가능합니다. 실제 추천 품질을 높이려면 Product에 리뷰/판매
// 통계, 면적당 소요량(커버리지) 컬럼을 추가하는 후속 작업이 필요합니다(내부용 보고서 참고).
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductRecommendationService {

	private static final int RECOMMENDATION_LIMIT_PER_CATEGORY = 3;

	private final ProductRepository productRepository;
	private final AnalysisJobRepository analysisJobRepository;

	public List<RecommendedProductResponse> recommend(Long requestId) {
		AnalysisJob analysis = analysisJobRepository.findByRequestId(requestId)
				.orElseThrow(() -> new AnalysisNotFoundException("해당 의뢰의 분석 결과가 없습니다: " + requestId));

		List<RecommendedProductResponse> result = new ArrayList<>();
		result.addAll(recommendByCategory(ProductCategory.FLOORING, analysis.getIssueTags()));
		result.addAll(recommendByCategory(ProductCategory.WALLPAPER, analysis.getIssueTags()));
		return result;
	}

	private List<RecommendedProductResponse> recommendByCategory(ProductCategory category, String issueTags) {
		List<Product> products = productRepository
				.findByCategoryAndStatusOrderBySalePriceAsc(category, ProductStatus.ON_SALE,
						PageRequest.of(0, RECOMMENDATION_LIMIT_PER_CATEGORY))
				.getContent();

		String reason = buildReason(category, issueTags);
		List<RecommendedProductResponse> responses = new ArrayList<>();
		for (Product product : products) {
			int quantity = product.getMinOrderQty() != null && product.getMinOrderQty() > 0 ? product.getMinOrderQty()
					: 1;
			Long unitPrice = product.getSalePrice() != null ? product.getSalePrice() : 0L;
			responses.add(new RecommendedProductResponse(product.getId(), product.getName(),
					product.getVendor().getName(), null, unitPrice, quantity, unitPrice * quantity, reason));
		}
		return responses;
	}

	private String buildReason(ProductCategory category, String issueTags) {
		boolean matchesIssue = issueTags != null && ((category == ProductCategory.FLOORING
				&& (issueTags.contains("바닥") || issueTags.contains("장판")))
				|| (category == ProductCategory.WALLPAPER && issueTags.contains("벽지")));
		if (matchesIssue) {
			return "AI 분석에서 감지된 이슈(" + issueTags + ")에 대응하는 " + categoryLabel(category) + " 추천 상품입니다.";
		}
		return "판매중인 " + categoryLabel(category) + " 상품 중 합리적인 가격대의 추천 상품입니다.";
	}

	private String categoryLabel(ProductCategory category) {
		return category == ProductCategory.FLOORING ? "바닥재" : "벽지";
	}
}
