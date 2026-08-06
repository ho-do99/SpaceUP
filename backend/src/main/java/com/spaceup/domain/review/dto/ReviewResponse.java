package com.spaceup.domain.review.dto;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import com.spaceup.domain.review.entity.Review;

public record ReviewResponse(
		Long id,
		Long requestId,
		Long contractorId,
		String reviewerName,
		int rating,
		String content,
		List<String> keywords,
		LocalDateTime createdAt) {

	public ReviewResponse(Review review) {
		this(review.getId(), review.getRequest().getId(), review.getContractor().getId(),
				maskName(review.getReviewer().getName()), review.getRating(), review.getContent(),
				review.getKeywords() == null || review.getKeywords().isBlank() ? List.of()
						: Arrays.asList(review.getKeywords().split(",")),
				review.getCreatedAt());
	}

	// ⭐ [프론트 연동] ContractorReview.userName 예시가 "홍*동" 형태(가운데 마스킹)라 동일하게 처리
	private static String maskName(String name) {
		if (name == null || name.length() < 2) {
			return name;
		}
		if (name.length() == 2) {
			return name.charAt(0) + "*";
		}
		char[] chars = name.toCharArray();
		for (int i = 1; i < chars.length - 1; i++) {
			chars[i] = '*';
		}
		return new String(chars);
	}
}
