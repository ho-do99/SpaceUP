package com.spaceup.domain.review.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.contractor.service.ContractorProfileService;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.entity.NotificationType;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.project.entity.ProjectStatus;
import com.spaceup.domain.project.repository.ContractorProjectRepository;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.review.dto.ReviewCreateRequest;
import com.spaceup.domain.review.dto.ReviewResponse;
import com.spaceup.domain.review.dto.ReviewSummaryResponse;
import com.spaceup.domain.review.entity.Review;
import com.spaceup.domain.review.repository.ReviewRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.InvalidStatusTransitionException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.RequestNotFoundException;
import com.spaceup.global.error.ReviewNotFoundException;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "리뷰" 화면. 임대인이 작성, 시공사는 읽기 전용(수정/삭제 불가)
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

	private final ReviewRepository reviewRepository;
	private final QuoteRequestRepository quoteRequestRepository;
	private final MemberRepository memberRepository;
	private final ContractorProjectRepository contractorProjectRepository;
	private final ContractorProfileService contractorProfileService;
	private final NotificationService notificationService;

	// ⭐ 공사 진행(ContractorProject)이 COMPLETED 상태여야 작성 가능 - 완료도 안 된 공사에 리뷰가 달리는 걸 방지
	@Transactional
	public ReviewResponse create(Long requestId, Long landlordId, ReviewCreateRequest dto) {
		QuoteRequest request = quoteRequestRepository.findById(requestId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
		if (!request.getOwner().getId().equals(landlordId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰에만 리뷰를 작성할 수 있습니다.");
		}
		if (reviewRepository.existsByRequestId(requestId)) {
			throw new InvalidStatusTransitionException("이미 리뷰를 작성한 의뢰입니다.");
		}
		ProjectStatus projectStatus = contractorProjectRepository.findByRequestId(requestId)
				.map(project -> project.getStatus())
				.orElseThrow(() -> new InvalidStatusTransitionException("공사가 완료된 의뢰에만 리뷰를 작성할 수 있습니다."));
		if (projectStatus != ProjectStatus.COMPLETED) {
			throw new InvalidStatusTransitionException("공사가 완료된 의뢰에만 리뷰를 작성할 수 있습니다.");
		}

		Member reviewer = findMemberOrThrow(landlordId);
		Member contractor = request.getContractor();

		Review review = Review.builder().request(request).reviewer(reviewer).contractor(contractor)
				.rating(dto.getRating()).content(dto.getContent())
				.keywords(dto.getKeywords() != null ? String.join(",", dto.getKeywords()) : null).build();
		reviewRepository.save(review);

		refreshContractorRating(contractor.getId());

		notificationService.notify(contractor.getId(), NotificationType.REVIEW, "새 리뷰가 등록되었습니다",
				String.format("%s님이 %d점 리뷰를 남겼습니다.", reviewer.getName(), dto.getRating()));
		return new ReviewResponse(review);
	}

	public ReviewResponse getReview(Long reviewId) {
		return new ReviewResponse(findOrThrow(reviewId));
	}

	// ⭐ ContractorReviewFilter: all | five | four | three_or_less
	public Page<ReviewResponse> getReviewsByContractor(Long contractorId, String filter, Pageable pageable) {
		Page<Review> reviews = switch (filter == null ? "all" : filter) {
			case "five" -> reviewRepository.findByContractorIdAndRatingOrderByCreatedAtDesc(contractorId, 5, pageable);
			case "four" -> reviewRepository.findByContractorIdAndRatingOrderByCreatedAtDesc(contractorId, 4, pageable);
			case "three_or_less" ->
				reviewRepository.findByContractorIdAndRatingLessThanEqualOrderByCreatedAtDesc(contractorId, 3, pageable);
			default -> reviewRepository.findByContractorIdOrderByCreatedAtDesc(contractorId, pageable);
		};
		return reviews.map(ReviewResponse::new);
	}

	public ReviewSummaryResponse getSummary(Long contractorId) {
		Member contractor = findMemberOrThrow(contractorId);
		Map<Integer, Long> ratingCounts = new LinkedHashMap<>();
		for (int rating = 1; rating <= 5; rating++) {
			ratingCounts.put(rating, reviewRepository.countByContractorIdAndRating(contractorId, rating));
		}
		double average = reviewRepository.findAverageRatingByContractorId(contractorId);
		long total = reviewRepository.countByContractorId(contractorId);
		return new ReviewSummaryResponse(contractorId, contractor.getName(), Math.round(average * 10) / 10.0, total,
				ratingCounts);
	}

	// ⭐ 리뷰가 생기거나 바뀔 때마다 ContractorProfile.rating/reviewCount를 재계산해 반영
	private void refreshContractorRating(Long contractorId) {
		double average = reviewRepository.findAverageRatingByContractorId(contractorId);
		long total = reviewRepository.countByContractorId(contractorId);
		contractorProfileService.updateRating(contractorId, Math.round(average * 10) / 10.0, (int) total);
	}

	private Member findMemberOrThrow(Long memberId) {
		return memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
	}

	private Review findOrThrow(Long reviewId) {
		return reviewRepository.findById(reviewId)
				.orElseThrow(() -> new ReviewNotFoundException("존재하지 않는 리뷰입니다: " + reviewId));
	}
}
