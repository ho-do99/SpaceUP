package com.spaceup.domain.matching.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.contractor.entity.ContractorProfile;
import com.spaceup.domain.contractor.repository.ContractorProfileRepository;
import com.spaceup.domain.matching.dto.MatchingScoreResult;
import com.spaceup.domain.matching.dto.RecommendedContractorResponse;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.RequestNotFoundException;

@ExtendWith(MockitoExtension.class)
class ContractorRecommendationServiceTest {

	private static final Long REQUEST_ID = 1L;
	private static final Long OWNER_ID = 100L;

	@Mock
	private QuoteRequestRepository quoteRequestRepository;
	@Mock
	private ContractorProfileRepository contractorProfileRepository;
	@Mock
	private MatchingScoreCalculator matchingScoreCalculator;

	private ContractorRecommendationService service;
	private QuoteRequest request;

	@BeforeEach
	void setUp() {
		service = new ContractorRecommendationService(quoteRequestRepository, contractorProfileRepository,
				matchingScoreCalculator);
		Member owner = Member.builder().id(OWNER_ID).build();
		request = QuoteRequest.builder().id(REQUEST_ID).owner(owner).build();
	}

	@Test
	void throwsWhenRequestDoesNotExist() {
		when(quoteRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.recommend(REQUEST_ID, OWNER_ID))
				.isInstanceOf(RequestNotFoundException.class);
	}

	@Test
	void throwsForbiddenWhenRequesterIsNotOwner() {
		when(quoteRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));

		assertThatThrownBy(() -> service.recommend(REQUEST_ID, 999L)).isInstanceOf(ForbiddenAccessException.class);
	}

	@Test
	void returnsEmptyListWhenNoCandidates() {
		when(quoteRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));
		when(contractorProfileRepository.findRecommendationCandidates()).thenReturn(List.of());

		List<RecommendedContractorResponse> result = service.recommend(REQUEST_ID, OWNER_ID);

		assertThat(result).isEmpty();
	}

	@Test
	void sortsByMatchScoreDescendingAndAssignsRank() {
		when(quoteRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));
		ContractorProfile low = candidate(1L);
		ContractorProfile high = candidate(2L);
		when(contractorProfileRepository.findRecommendationCandidates()).thenReturn(List.of(low, high));
		when(matchingScoreCalculator.calculate(request, low)).thenReturn(scoreOf("50.00"));
		when(matchingScoreCalculator.calculate(request, high)).thenReturn(scoreOf("90.00"));

		List<RecommendedContractorResponse> result = service.recommend(REQUEST_ID, OWNER_ID);

		assertThat(result).hasSize(2);
		assertThat(result.get(0).contractorId()).isEqualTo(2L);
		assertThat(result.get(0).recommendationRank()).isEqualTo(1);
		assertThat(result.get(1).contractorId()).isEqualTo(1L);
		assertThat(result.get(1).recommendationRank()).isEqualTo(2);
	}

	@Test
	void limitsToTopThreeWhenMoreCandidatesExist() {
		when(quoteRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));
		List<ContractorProfile> candidates = List.of(candidate(1L), candidate(2L), candidate(3L), candidate(4L));
		when(contractorProfileRepository.findRecommendationCandidates()).thenReturn(candidates);
		when(matchingScoreCalculator.calculate(any(QuoteRequest.class), any(ContractorProfile.class)))
				.thenReturn(scoreOf("70.00"));

		List<RecommendedContractorResponse> result = service.recommend(REQUEST_ID, OWNER_ID);

		assertThat(result).hasSize(3);
	}

	@Test
	void tieBreaksByReviewScoreThenPriceScoreThenScheduleScoreThenRatingThenReviewCountThenMemberIdAscending() {
		when(quoteRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));
		ContractorProfile a = candidateWithReview(5L, 4.0, 10);
		ContractorProfile b = candidateWithReview(3L, 4.0, 10);
		when(contractorProfileRepository.findRecommendationCandidates()).thenReturn(List.of(a, b));
		// 모든 세부 점수가 완전히 동일 -> rating/reviewCount도 같음 -> 마지막 기준(memberId 오름차순)으로만 갈림
		when(matchingScoreCalculator.calculate(request, a))
				.thenReturn(new MatchingScoreResult(new BigDecimal("40.00"), 35, 25, new BigDecimal("100.00")));
		when(matchingScoreCalculator.calculate(request, b))
				.thenReturn(new MatchingScoreResult(new BigDecimal("40.00"), 35, 25, new BigDecimal("100.00")));

		List<RecommendedContractorResponse> result = service.recommend(REQUEST_ID, OWNER_ID);

		assertThat(result.get(0).contractorId()).isEqualTo(3L); // 더 작은 memberId가 먼저
		assertThat(result.get(1).contractorId()).isEqualTo(5L);
	}

	@Test
	void excludesCandidateWithRatingAboveFive() {
		when(quoteRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));
		ContractorProfile invalid = candidateWithReview(1L, 9.9, 5);
		when(contractorProfileRepository.findRecommendationCandidates()).thenReturn(List.of(invalid));

		List<RecommendedContractorResponse> result = service.recommend(REQUEST_ID, OWNER_ID);

		assertThat(result).isEmpty();
	}

	@Test
	void excludesCandidateWithNegativeReviewCount() {
		when(quoteRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));
		ContractorProfile invalid = candidateWithReview(1L, 4.0, -3);
		when(contractorProfileRepository.findRecommendationCandidates()).thenReturn(List.of(invalid));

		List<RecommendedContractorResponse> result = service.recommend(REQUEST_ID, OWNER_ID);

		assertThat(result).isEmpty();
	}

	@Test
	void includesCandidateWithNoReviewsAtAll() {
		when(quoteRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));
		ContractorProfile noReviews = candidateWithReview(1L, null, 0);
		when(contractorProfileRepository.findRecommendationCandidates()).thenReturn(List.of(noReviews));
		when(matchingScoreCalculator.calculate(request, noReviews)).thenReturn(scoreOf("35.00"));

		List<RecommendedContractorResponse> result = service.recommend(REQUEST_ID, OWNER_ID);

		assertThat(result).hasSize(1);
	}

	@Test
	void sameInputProducesSameResultAcrossCalls() {
		when(quoteRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));
		ContractorProfile a = candidate(1L);
		ContractorProfile b = candidate(2L);
		when(contractorProfileRepository.findRecommendationCandidates()).thenReturn(List.of(a, b));
		when(matchingScoreCalculator.calculate(request, a)).thenReturn(scoreOf("80.00"));
		when(matchingScoreCalculator.calculate(request, b)).thenReturn(scoreOf("80.00"));

		List<RecommendedContractorResponse> first = service.recommend(REQUEST_ID, OWNER_ID);
		List<RecommendedContractorResponse> second = service.recommend(REQUEST_ID, OWNER_ID);

		assertThat(first).isEqualTo(second);
	}

	private ContractorProfile candidate(Long memberId) {
		return candidateWithReview(memberId, 4.0, 10);
	}

	private ContractorProfile candidateWithReview(Long memberId, Double rating, Integer reviewCount) {
		Member member = Member.builder().id(memberId).build();
		return ContractorProfile.builder().member(member).rating(rating).reviewCount(reviewCount)
				.estimateMin(50_000_000L).estimateMax(80_000_000L).availableFromDate(LocalDate.of(2026, 6, 1))
				.build();
	}

	private MatchingScoreResult scoreOf(String matchScore) {
		BigDecimal score = new BigDecimal(matchScore);
		return new MatchingScoreResult(score, 0, 0, score);
	}
}
