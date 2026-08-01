package com.spaceup.domain.matching.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import com.spaceup.domain.contractor.entity.ContractorProfile;
import com.spaceup.domain.matching.dto.MatchingScoreResult;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.request.entity.QuoteRequest;

class RuleBasedMatchingScoreCalculatorTest {

	private final RuleBasedMatchingScoreCalculator calculator = new RuleBasedMatchingScoreCalculator();

	@Nested
	class ReviewScore {

		@Test
		void ratingAndReviewCountCombineToExpectedExample() {
			// rating=4.8, reviewCount=128 -> 4.8/5*32=30.72 + reviewCount(100+)=8 -> 38.72
			assertThat(calculator.calculateReviewScore(4.8, 128)).isEqualByComparingTo("38.72");
		}

		@Test
		void perfectRatingWithMaxReviewCountCapsAtForty() {
			assertThat(calculator.calculateReviewScore(5.0, 100)).isEqualByComparingTo("40.00");
		}

		@Test
		void zeroReviewCountYieldsZeroCountScore() {
			assertThat(calculator.calculateReviewScore(5.0, 0)).isEqualByComparingTo("32.00");
		}

		@ParameterizedTest(name = "reviewCount={0} -> countScore={1}")
		@CsvSource({
				"9, 1",
				"10, 2",
				"19, 2",
				"20, 4",
				"49, 4",
				"50, 6",
				"99, 6",
				"100, 8",
		})
		void reviewCountBoundaries(int reviewCount, int expectedCountScore) {
			// rating=0이면 평점 점수가 0이라 리뷰개수 점수만 그대로 드러남
			assertThat(calculator.calculateReviewScore(0, reviewCount))
					.isEqualByComparingTo(BigDecimal.valueOf(expectedCountScore).setScale(2));
		}
	}

	@Nested
	class PriceScore {

		@Test
		void withinRangeIsMaxScore() {
			assertThat(calculator.calculatePriceScore(60_000_000L, 50_000_000L, 80_000_000L)).isEqualTo(35);
		}

		@Test
		void exactlyAtMinimumIsMaxScore() {
			assertThat(calculator.calculatePriceScore(50_000_000L, 50_000_000L, 80_000_000L)).isEqualTo(35);
		}

		@Test
		void exactlyAtMaximumIsMaxScore() {
			assertThat(calculator.calculatePriceScore(80_000_000L, 50_000_000L, 80_000_000L)).isEqualTo(35);
		}

		@Test
		void exactlyTenPercentBelowMinimum() {
			// (100 - 90) / 90 * 100 = 11.11...% -> 90만원 기준 정확히 10% 차이가 나도록 역산
			long userEstimate = 90_000_000L;
			long contractorMin = 99_000_000L; // (99-90)/90*100 = 10%
			assertThat(calculator.calculatePriceScore(userEstimate, contractorMin, contractorMin + 1)).isEqualTo(28);
		}

		@Test
		void exactlyTwentyPercentBelowMinimum() {
			long userEstimate = 100_000_000L;
			long contractorMin = 120_000_000L; // (120-100)/100*100 = 20%
			assertThat(calculator.calculatePriceScore(userEstimate, contractorMin, contractorMin + 1)).isEqualTo(20);
		}

		@Test
		void exactlyThirtyPercentBelowMinimum() {
			long userEstimate = 100_000_000L;
			long contractorMin = 130_000_000L; // (130-100)/100*100 = 30%
			assertThat(calculator.calculatePriceScore(userEstimate, contractorMin, contractorMin + 1)).isEqualTo(10);
		}

		@Test
		void moreThanThirtyPercentBelowMinimumIsZero() {
			long userEstimate = 100_000_000L;
			long contractorMin = 131_000_000L;
			assertThat(calculator.calculatePriceScore(userEstimate, contractorMin, contractorMin + 1)).isEqualTo(0);
		}

		@Test
		void userEstimateAboveMaximumUsesSameTiers() {
			long userEstimate = 100_000_000L;
			long contractorMax = 91_000_000L; // (100-91)/100*100 = 9% -> 10% 이내
			assertThat(calculator.calculatePriceScore(userEstimate, contractorMax - 1_000_000L, contractorMax))
					.isEqualTo(28);
		}

		@Test
		void zeroUserEstimateIsZero() {
			assertThat(calculator.calculatePriceScore(0L, 50_000_000L, 80_000_000L)).isEqualTo(0);
		}

		@Test
		void negativeContractorMinIsZero() {
			assertThat(calculator.calculatePriceScore(60_000_000L, -1L, 80_000_000L)).isEqualTo(0);
		}

		@Test
		void contractorMaxBelowMinIsZero() {
			assertThat(calculator.calculatePriceScore(60_000_000L, 80_000_000L, 50_000_000L)).isEqualTo(0);
		}
	}

	@Nested
	class ScheduleScore {

		private final LocalDate desired = LocalDate.of(2026, 6, 1);

		@Test
		void earlierThanDesiredIsMaxScore() {
			assertThat(calculator.calculateScheduleScore(desired, desired.minusDays(3))).isEqualTo(25);
		}

		@Test
		void sameDayIsMaxScore() {
			assertThat(calculator.calculateScheduleScore(desired, desired)).isEqualTo(25);
		}

		@ParameterizedTest(name = "daysLate={0} -> score={1}")
		@CsvSource({
				"1, 20",
				"7, 20",
				"8, 15",
				"14, 15",
				"15, 8",
				"30, 8",
				"31, 0",
		})
		void daysLateBoundaries(int daysLate, int expectedScore) {
			assertThat(calculator.calculateScheduleScore(desired, desired.plusDays(daysLate))).isEqualTo(expectedScore);
		}

		@Test
		void nullDesiredDateIsZero() {
			assertThat(calculator.calculateScheduleScore(null, desired)).isEqualTo(0);
		}

		@Test
		void nullAvailableDateIsZero() {
			assertThat(calculator.calculateScheduleScore(desired, null)).isEqualTo(0);
		}
	}

	@Nested
	class MatchScore {

		@Test
		void sumsAllThreeComponents() {
			BigDecimal result = calculator.calculateMatchScore(new BigDecimal("38.72"), 35, 25);
			assertThat(result).isEqualByComparingTo("98.72");
		}

		@Test
		void cappedAtOneHundred() {
			BigDecimal result = calculator.calculateMatchScore(new BigDecimal("40.00"), 35, 25);
			assertThat(result).isEqualByComparingTo("100.00");
		}

		@Test
		void roundsHalfUpToTwoDecimals() {
			BigDecimal result = calculator.calculateMatchScore(new BigDecimal("10.005"), 0, 0);
			assertThat(result).isEqualByComparingTo("10.01");
		}
	}

	@Nested
	class OrchestratedCalculate {

		@Test
		void endToEndMatchesSpecExample() {
			QuoteRequest request = requestWithBudgetAndDate(65_000_000L, "2026-06-05");
			ContractorProfile profile = profileWith(4.8, 128, 50_000_000L, 80_000_000L, LocalDate.of(2026, 6, 5));

			MatchingScoreResult result = calculator.calculate(request, profile);

			assertThat(result.reviewScore()).isEqualByComparingTo("38.72");
			assertThat(result.priceScore()).isEqualTo(35);
			assertThat(result.scheduleScore()).isEqualTo(25);
			assertThat(result.matchScore()).isEqualByComparingTo("98.72");
		}

		@Test
		void nullRatingIsTreatedAsNoReview() {
			QuoteRequest request = requestWithBudgetAndDate(65_000_000L, "2026-06-05");
			ContractorProfile profile = profileWith(null, null, 50_000_000L, 80_000_000L, LocalDate.of(2026, 6, 5));

			MatchingScoreResult result = calculator.calculate(request, profile);

			assertThat(result.reviewScore()).isEqualByComparingTo("0.00");
		}

		@Test
		void ratingOutOfRangeIsNormalizedToZeroNotThrown() {
			QuoteRequest request = requestWithBudgetAndDate(65_000_000L, "2026-06-05");
			ContractorProfile profile = profileWith(9.9, -3, 50_000_000L, 80_000_000L, LocalDate.of(2026, 6, 5));

			MatchingScoreResult result = calculator.calculate(request, profile);

			assertThat(result.reviewScore()).isEqualByComparingTo("0.00");
		}

		@Test
		void missingContractorEstimateRangeYieldsZeroPriceScore() {
			QuoteRequest request = requestWithBudgetAndDate(65_000_000L, "2026-06-05");
			ContractorProfile profile = profileWith(4.5, 10, null, null, LocalDate.of(2026, 6, 5));

			MatchingScoreResult result = calculator.calculate(request, profile);

			assertThat(result.priceScore()).isEqualTo(0);
		}

		@Test
		void unparsableDesiredDateYieldsZeroScheduleScore() {
			QuoteRequest request = requestWithBudgetAndDate(65_000_000L, "잘못된날짜");
			ContractorProfile profile = profileWith(4.5, 10, 50_000_000L, 80_000_000L, LocalDate.of(2026, 6, 5));

			MatchingScoreResult result = calculator.calculate(request, profile);

			assertThat(result.scheduleScore()).isEqualTo(0);
		}

		private QuoteRequest requestWithBudgetAndDate(Long budgetMax, String desiredDate) {
			return QuoteRequest.builder().id(1L).budgetMax(budgetMax).desiredDate(desiredDate).build();
		}

		private ContractorProfile profileWith(Double rating, Integer reviewCount, Long estimateMin, Long estimateMax,
				LocalDate availableFromDate) {
			Member member = Member.builder().id(10L).build();
			return ContractorProfile.builder().member(member).rating(rating).reviewCount(reviewCount)
					.estimateMin(estimateMin).estimateMax(estimateMax).availableFromDate(availableFromDate).build();
		}
	}
}
