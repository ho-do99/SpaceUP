package com.spaceup.domain.matching.service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.contractor.entity.ContractorProfile;
import com.spaceup.domain.contractor.repository.ContractorProfileRepository;
import com.spaceup.domain.matching.dto.MatchingScoreResult;
import com.spaceup.domain.matching.dto.RecommendedContractorResponse;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.RequestNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * ⭐ [시공사 추천 점수 구성] "백엔드 처리 순서" 5~8단계 - 추천 후보(승인/공개/상담가능/견적범위/가능일 조건을 모두
 * 만족하는 시공사)에 대해 MatchingScoreCalculator로 점수를 매기고, 점수 높은 순으로 정렬해 상위 3개만 추립니다.
 *
 * ⭐ [시공사 추천 점수 고도화] 의뢰 소유자 검증을 추가하고, 후보 조회를 fetch join 쿼리 1번으로 끝내(N+1 제거),
 * 동점 처리를 위한 7단계 tie-break 정렬과 추천 순위(recommendationRank)를 추가했습니다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContractorRecommendationService {

	private static final int TOP_N = 3;

	// ⭐ matchScore → reviewScore → priceScore → scheduleScore → rating → reviewCount → contractorMemberId(오름차순)
	// 순서로 동점을 깹니다. 마지막 기준까지도 같을 수는 없으므로(멤버 PK는 유일) 항상 결정적인 순서가 나옵니다.
	private static final Comparator<Scored> RANKING_ORDER = Comparator
			.comparing((Scored s) -> s.result().matchScore()).reversed()
			.thenComparing(Comparator.comparing((Scored s) -> s.result().reviewScore()).reversed())
			.thenComparing(Comparator.comparingInt((Scored s) -> s.result().priceScore()).reversed())
			.thenComparing(Comparator.comparingInt((Scored s) -> s.result().scheduleScore()).reversed())
			.thenComparing(Comparator.comparingDouble((Scored s) -> nullToZero(s.profile().getRating())).reversed())
			.thenComparing(Comparator.comparingInt((Scored s) -> nullToZero(s.profile().getReviewCount())).reversed())
			.thenComparing((Scored s) -> s.profile().getMember().getId());

	private final QuoteRequestRepository quoteRequestRepository;
	private final ContractorProfileRepository contractorProfileRepository;
	private final MatchingScoreCalculator matchingScoreCalculator;

	public List<RecommendedContractorResponse> recommend(Long requestId, Long memberId) {
		QuoteRequest request = quoteRequestRepository.findById(requestId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
		if (!request.getOwner().getId().equals(memberId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰만 추천 시공사를 조회할 수 있습니다.");
		}

		List<Scored> ranked = contractorProfileRepository.findRecommendationCandidates().stream()
				.filter(this::hasValidReviewData)
				.map(profile -> new Scored(profile, matchingScoreCalculator.calculate(request, profile)))
				.sorted(RANKING_ORDER)
				.limit(TOP_N)
				.collect(Collectors.toList());

		return IntStream.range(0, ranked.size()).mapToObj(i -> toResponse(ranked.get(i), i + 1))
				.collect(Collectors.toList());
	}

	// ⭐ rating/reviewCount 자체가 유효 범위를 벗어난(데이터 이상) 후보는 추천 목록에서 제외합니다. 계산기
	// (RuleBasedMatchingScoreCalculator)는 이런 값도 0점으로 정규화해서 항상 점수를 내지만(assignContractor()처럼
	// "이미 확정된 시공사"의 점수는 반드시 계산돼야 하므로), "추천" 맥락에서는 애초에 후보에서 빼는 게 맞습니다.
	private boolean hasValidReviewData(ContractorProfile profile) {
		Double rating = profile.getRating();
		Integer reviewCount = profile.getReviewCount();
		if (rating != null && (rating < 0 || rating > 5)) {
			return false;
		}
		return reviewCount == null || reviewCount >= 0;
	}

	private static double nullToZero(Double value) {
		return value != null ? value : 0;
	}

	private static int nullToZero(Integer value) {
		return value != null ? value : 0;
	}

	private RecommendedContractorResponse toResponse(Scored scored, int rank) {
		ContractorProfile profile = scored.profile();
		MatchingScoreResult result = scored.result();
		return new RecommendedContractorResponse(profile.getMember().getId(), profile.getCompanyName(),
				profile.getRating(), profile.getReviewCount(), profile.getEstimateMin(), profile.getEstimateMax(),
				profile.getAvailableFromDate(), result.reviewScore(), result.priceScore(), result.scheduleScore(),
				result.matchScore(), rank);
	}

	private record Scored(ContractorProfile profile, MatchingScoreResult result) {
	}
}
