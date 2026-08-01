package com.spaceup.domain.matching.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;

import org.springframework.stereotype.Service;

import com.spaceup.domain.contractor.entity.ContractorProfile;
import com.spaceup.domain.matching.dto.MatchingScoreResult;
import com.spaceup.domain.request.entity.QuoteRequest;

/**
 * ⭐ [시공사 추천 점수 구성] 리뷰(40) + 예상 견적 적합도(35) + 일정 적합도(25) = 100점.
 *
 * ⭐ [시공사 추천 점수 고도화] Repository 의존 없는 순수 계산기입니다. 호출자(ContractorRecommendationService /
 * RequestService)가 후보 필터링·조회를 끝낸 ContractorProfile을 넘겨주면, 그 값만으로 점수를 계산합니다.
 * rating/reviewCount가 null이거나 범위를 벗어난 값(rating<0, rating>5, reviewCount<0)은 여기서는 0으로
 * 정규화해서 계산합니다 - "후보를 추천 목록에서 아예 뺄지"는 ContractorRecommendationService의 책임이고,
 * 이 계산기는 assignContractor()처럼 "이미 확정된 시공사 1명의 점수"를 항상 안전하게 산출해야 하는 경로에서도
 * 쓰이기 때문에 예외를 던지지 않고 항상 값을 반환합니다.
 */
@Service
public class RuleBasedMatchingScoreCalculator implements MatchingScoreCalculator {

	private static final BigDecimal MAX_RATING_SCORE = BigDecimal.valueOf(32);
	private static final BigDecimal MAX_REVIEW_SCORE = BigDecimal.valueOf(40);
	private static final BigDecimal FIVE = BigDecimal.valueOf(5);
	private static final int MAX_PRICE_SCORE = 35;
	private static final int MAX_SCHEDULE_SCORE = 25;
	private static final BigDecimal MAX_TOTAL_SCORE = BigDecimal.valueOf(100);
	private static final int SCALE = 2;

	@Override
	public MatchingScoreResult calculate(QuoteRequest request, ContractorProfile profile) {
		double rating = normalizeRating(profile.getRating());
		int reviewCount = normalizeReviewCount(profile.getReviewCount());
		BigDecimal reviewScore = calculateReviewScore(rating, reviewCount);

		Long userEstimate = request.getBudgetMax() != null ? request.getBudgetMax() : request.getBudget();
		Long contractorMin = profile.getEstimateMin();
		Long contractorMax = profile.getEstimateMax();
		int priceScore = (userEstimate != null && contractorMin != null && contractorMax != null)
				? calculatePriceScore(userEstimate, contractorMin, contractorMax)
				: 0;

		LocalDate desiredDate = parseDate(request.getDesiredDate());
		int scheduleScore = calculateScheduleScore(desiredDate, profile.getAvailableFromDate());

		BigDecimal matchScore = calculateMatchScore(reviewScore, priceScore, scheduleScore);
		return new MatchingScoreResult(reviewScore, priceScore, scheduleScore, matchScore);
	}

	// ⭐ rating이 null이거나 유효 범위(0~5)를 벗어나면 "리뷰 없음"과 동일하게 0으로 취급합니다.
	private double normalizeRating(Double rating) {
		if (rating == null || rating < 0 || rating > 5) {
			return 0;
		}
		return rating;
	}

	private int normalizeReviewCount(Integer reviewCount) {
		if (reviewCount == null || reviewCount < 0) {
			return 0;
		}
		return reviewCount;
	}

	// ⭐ 1. 리뷰 점수 - 최대 40점 (평점 최대 32점 + 리뷰개수 최대 8점). BigDecimal + HALF_UP + 소수점 둘째 자리.
	public BigDecimal calculateReviewScore(double rating, int reviewCount) {
		BigDecimal ratingScore = BigDecimal.valueOf(rating).divide(FIVE, 10, RoundingMode.HALF_UP)
				.multiply(MAX_RATING_SCORE);
		BigDecimal countScore = BigDecimal.valueOf(reviewCountScore(reviewCount));
		BigDecimal total = ratingScore.add(countScore).min(MAX_REVIEW_SCORE);
		return total.setScale(SCALE, RoundingMode.HALF_UP);
	}

	private int reviewCountScore(int reviewCount) {
		if (reviewCount >= 100) {
			return 8;
		} else if (reviewCount >= 50) {
			return 6;
		} else if (reviewCount >= 20) {
			return 4;
		} else if (reviewCount >= 10) {
			return 2;
		} else if (reviewCount >= 1) {
			return 1;
		}
		return 0;
	}

	// ⭐ 2. 예상 견적 적합도 - 최대 35점. 사용자 예상 견적이 업체 견적 범위(estimateMin~Max) 안에 들면 만점,
	// 벗어난 정도(차이율)에 따라 감점합니다. 경계값(정확히 10/20/30%)은 상위 구간에 포함됩니다.
	public int calculatePriceScore(long userEstimate, long contractorMinPrice, long contractorMaxPrice) {
		if (userEstimate <= 0 || contractorMinPrice < 0 || contractorMaxPrice < contractorMinPrice) {
			return 0;
		}
		if (userEstimate >= contractorMinPrice && userEstimate <= contractorMaxPrice) {
			return MAX_PRICE_SCORE;
		}

		double diffPercent;
		if (userEstimate < contractorMinPrice) {
			diffPercent = (contractorMinPrice - userEstimate) / (double) userEstimate * 100;
		} else {
			diffPercent = (userEstimate - contractorMaxPrice) / (double) userEstimate * 100;
		}

		if (diffPercent <= 10) {
			return 28;
		} else if (diffPercent <= 20) {
			return 20;
		} else if (diffPercent <= 30) {
			return 10;
		}
		return 0;
	}

	// ⭐ 3. 일정 적합도 - 최대 25점. 희망 공사 시작일 대비 업체의 가장 빠른 가능일이 얼마나 늦는지로 채점합니다.
	public int calculateScheduleScore(LocalDate desiredDate, LocalDate availableDate) {
		if (desiredDate == null || availableDate == null) {
			return 0;
		}
		long daysLate = ChronoUnit.DAYS.between(desiredDate, availableDate);
		if (daysLate <= 0) {
			return MAX_SCHEDULE_SCORE;
		} else if (daysLate <= 7) {
			return 20;
		} else if (daysLate <= 14) {
			return 15;
		} else if (daysLate <= 30) {
			return 8;
		}
		return 0;
	}

	// ⭐ 4. 최종 점수 = 리뷰 + 견적 + 일정, 최대 100점, HALF_UP 소수점 둘째 자리.
	public BigDecimal calculateMatchScore(BigDecimal reviewScore, int priceScore, int scheduleScore) {
		BigDecimal total = reviewScore.add(BigDecimal.valueOf(priceScore)).add(BigDecimal.valueOf(scheduleScore));
		return total.min(MAX_TOTAL_SCORE).setScale(SCALE, RoundingMode.HALF_UP);
	}

	// ⭐ QuoteRequest.desiredDate는 "yyyy-MM-dd" 형식의 자유 입력 문자열이라 파싱 실패 시 점수 계산에서 제외합니다.
	private LocalDate parseDate(String desiredDate) {
		if (desiredDate == null) {
			return null;
		}
		try {
			return LocalDate.parse(desiredDate);
		} catch (DateTimeParseException e) {
			return null;
		}
	}
}
