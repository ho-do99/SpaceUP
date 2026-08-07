package com.spaceup.domain.material.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.analysis.entity.AnalysisJob;
import com.spaceup.domain.analysis.repository.AnalysisJobRepository;
import com.spaceup.domain.material.dto.RecommendedMaterialResponse;
import com.spaceup.domain.material.entity.MaterialProduct;
import com.spaceup.domain.material.entity.MaterialTheme;
import com.spaceup.domain.material.entity.MaterialWorkType;
import com.spaceup.domain.material.repository.MaterialProductRepository;
import com.spaceup.domain.request.repository.RequestContractorRepository;
import com.spaceup.global.error.AnalysisNotFoundException;
import com.spaceup.global.error.ForbiddenAccessException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaterialRecommendationService {
	private static final int LIMIT_PER_WORK_TYPE = 3;

	private final MaterialProductRepository materialProductRepository;
	private final AnalysisJobRepository analysisJobRepository;
	private final RequestContractorRepository requestContractorRepository;

	public List<RecommendedMaterialResponse> recommend(Long requestId, Long memberId, MaterialTheme theme) {
		AnalysisJob analysis = analysisJobRepository.findByRequestId(requestId)
				.orElseThrow(() -> new AnalysisNotFoundException("해당 견적의 분석 결과가 없습니다: " + requestId));
		validateParticipant(analysis, memberId);
		MaterialTheme selectedTheme = theme != null ? theme : MaterialTheme.MODERN;

		List<RecommendedMaterialResponse> result = new ArrayList<>();
		result.addAll(recommendByWorkType(selectedTheme, MaterialWorkType.FLOORING,
				analysis.getTotalFloorAreaM2(), analysis.getIssueTags()));
		result.addAll(recommendByWorkType(selectedTheme, MaterialWorkType.WALLPAPER,
				analysis.getTotalWallpaperAreaM2(), analysis.getIssueTags()));
		result.addAll(recommendByWorkType(selectedTheme, MaterialWorkType.LIGHTING, null,
				analysis.getIssueTags()));
		return result;
	}

	private void validateParticipant(AnalysisJob analysis, Long memberId) {
		boolean owner = analysis.getRequest().getOwner().getId().equals(memberId);
		boolean contractor = requestContractorRepository
				.existsByRequestIdAndContractorId(analysis.getRequest().getId(), memberId);
		if (!owner && !contractor) {
			throw new ForbiddenAccessException("본인이 참여 중인 견적의 추천 자재만 조회할 수 있습니다.");
		}
	}

	private List<RecommendedMaterialResponse> recommendByWorkType(MaterialTheme theme,
			MaterialWorkType workType, Double relevantAreaM2, String issueTags) {
		List<MaterialProduct> products = materialProductRepository
				.findByThemeAndWorkTypeAndActiveTrueOrderByCurrentPriceAsc(theme, workType,
						PageRequest.of(0, LIMIT_PER_WORK_TYPE));
		List<RecommendedMaterialResponse> result = new ArrayList<>();
		int priority = 1;
		for (MaterialProduct product : products) {
			int quantity = calculateQuantity(product, relevantAreaM2);
			long unitPrice = product.getCurrentPrice().longValue();
			result.add(new RecommendedMaterialResponse(product.getId(), product.getProductName(),
					product.getWorkType().name(), product.getSpecJson(), product.getBrandName(),
					product.getBrandName(), product.getImageUrl(), unitPrice, product.getSaleUnit(), quantity,
					toDouble(product.getCoveragePerUnitM2()), unitPrice * quantity,
					buildReason(theme, workType, issueTags), priority++));
		}
		return result;
	}

	private int calculateQuantity(MaterialProduct product, Double relevantAreaM2) {
		BigDecimal coverage = product.getCoveragePerUnitM2();
		if (relevantAreaM2 != null && relevantAreaM2 > 0 && coverage != null && coverage.signum() > 0) {
			return (int) Math.ceil(relevantAreaM2 / coverage.doubleValue());
		}
		return 1;
	}

	private Double toDouble(BigDecimal value) {
		return value == null ? null : value.doubleValue();
	}

	private String buildReason(MaterialTheme theme, MaterialWorkType workType, String issueTags) {
		String issueContext = issueTags == null || issueTags.isBlank() ? "" : " 분석 이슈를 참고해";
		return themeLabel(theme) + " 테마와" + issueContext + " 가격대별로 비교할 수 있는 "
				+ workTypeLabel(workType) + " 자재입니다.";
	}

	private String themeLabel(MaterialTheme theme) {
		return switch (theme) {
			case MODERN -> "모던";
			case WOOD -> "우드";
			case WHITE -> "화이트";
			case MARBLE -> "대리석";
		};
	}

	private String workTypeLabel(MaterialWorkType workType) {
		return switch (workType) {
			case FLOORING -> "바닥재";
			case WALLPAPER -> "벽지";
			case LIGHTING -> "조명";
		};
	}
}
