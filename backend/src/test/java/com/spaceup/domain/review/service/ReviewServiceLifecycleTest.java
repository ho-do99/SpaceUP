package com.spaceup.domain.review.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.contractor.service.ContractorProfileService;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.project.entity.ContractorProject;
import com.spaceup.domain.project.entity.ProjectStatus;
import com.spaceup.domain.project.repository.ContractorProjectRepository;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestStatus;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.review.dto.ReviewCreateRequest;
import com.spaceup.domain.review.entity.Review;
import com.spaceup.domain.review.entity.ReviewKeyword;
import com.spaceup.domain.review.repository.ReviewRepository;

@ExtendWith(MockitoExtension.class)
class ReviewServiceLifecycleTest {

	@Mock ReviewRepository reviewRepository;
	@Mock QuoteRequestRepository quoteRequestRepository;
	@Mock MemberRepository memberRepository;
	@Mock ContractorProjectRepository contractorProjectRepository;
	@Mock ContractorProfileService contractorProfileService;
	@Mock NotificationService notificationService;
	@InjectMocks ReviewService service;

	@Test
	void landlordCanCreateOneReviewOnlyAfterProjectCompletion() {
		Member owner = Member.builder().id(10L).name("홍길동").build();
		Member contractor = Member.builder().id(20L).name("시공사").build();
		QuoteRequest request = QuoteRequest.builder().id(1L).owner(owner).contractor(contractor)
				.status(RequestStatus.COMPLETED).build();
		ContractorProject project = ContractorProject.builder().id(300L).request(request)
				.status(ProjectStatus.COMPLETED).build();
		ReviewCreateRequest input = new ReviewCreateRequest();
		input.setRating(5);
		input.setContent("마감이 깔끔합니다.");
		input.setKeywords(List.of(ReviewKeyword.CLEAN_FINISH, ReviewKeyword.SCHEDULE_KEPT));

		when(quoteRequestRepository.findById(1L)).thenReturn(Optional.of(request));
		when(reviewRepository.existsByRequestId(1L)).thenReturn(false);
		when(contractorProjectRepository.findByRequestId(1L)).thenReturn(Optional.of(project));
		when(memberRepository.findById(10L)).thenReturn(Optional.of(owner));
		when(reviewRepository.findAverageRatingByContractorId(20L)).thenReturn(5.0);
		when(reviewRepository.countByContractorId(20L)).thenReturn(1L);

		var response = service.create(1L, 10L, input);

		assertEquals(5, response.rating());
		assertEquals("홍*동", response.reviewerName());
		assertEquals(List.of("CLEAN_FINISH", "SCHEDULE_KEPT"), response.keywords());
		verify(reviewRepository).save(any(Review.class));
		verify(contractorProfileService).updateRating(20L, 5.0, 1);
	}
}
