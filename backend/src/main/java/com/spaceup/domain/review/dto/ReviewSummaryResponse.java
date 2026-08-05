package com.spaceup.domain.review.dto;

import java.util.Map;

public record ReviewSummaryResponse(
		Long contractorId,
		String contractorName,
		double averageRating,
		long totalCount,
		Map<Integer, Long> ratingCounts) {
}
