package com.spaceup.domain.request.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.analysis.repository.AnalysisJobRepository;
import com.spaceup.domain.analysis.service.AnalysisJobService;
import com.spaceup.domain.contractor.entity.ContractorProfile;
import com.spaceup.domain.contractor.repository.ContractorProfileRepository;
import com.spaceup.domain.matching.dto.MatchingScoreResult;
import com.spaceup.domain.matching.service.MatchingScoreCalculator;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.quote.repository.ContractorQuoteRepository;
import com.spaceup.domain.request.entity.Property;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.repository.PropertyRepository;
import com.spaceup.domain.request.repository.QuoteRequestRepository;

// ⭐ [시공사 추천 점수 고도화] RequestService.assignContractor()가 BigDecimal matchScore를 HALF_UP으로
// int 반올림해서 AnalysisJob에 저장하는지만 검증합니다(다른 assignContractor 동작은 기존 로직 그대로).
@ExtendWith(MockitoExtension.class)
class RequestServiceMatchingTest {

	private static final Long REQUEST_ID = 1L;
	private static final Long LANDLORD_ID = 100L;
	private static final Long CONTRACTOR_ID = 200L;

	@Mock
	private QuoteRequestRepository quoteRequestRepository;
	@Mock
	private PropertyRepository propertyRepository;
	@Mock
	private MemberRepository memberRepository;
	@Mock
	private MatchingScoreCalculator matchingScoreCalculator;
	@Mock
	private ContractorProfileRepository contractorProfileRepository;
	@Mock
	private AnalysisJobService analysisJobService;
	@Mock
	private AnalysisJobRepository analysisJobRepository;
	@Mock
	private ContractorQuoteRepository contractorQuoteRepository;
	@Mock
	private NotificationService notificationService;

	private RequestService requestService;

	@ParameterizedTest(name = "matchScore={0} -> 저장되는 int={1}")
	@CsvSource({
			"98.72, 99",
			"98.49, 98",
			"98.50, 99", // HALF_UP: 정확히 .50이면 올림
			"0.00, 0",
			"100.00, 100",
	})
	void roundsMatchScoreHalfUpBeforeSaving(String matchScoreValue, int expectedScore) {
		requestService = new RequestService(quoteRequestRepository, propertyRepository, memberRepository,
				matchingScoreCalculator, contractorProfileRepository, analysisJobService, analysisJobRepository,
				contractorQuoteRepository, notificationService);

		QuoteRequest request = requestWithLandlordOwner();
		ContractorProfile profile = ContractorProfile.builder().member(contractor()).build();

		when(quoteRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));
		when(memberRepository.findById(CONTRACTOR_ID)).thenReturn(Optional.of(contractor()));
		when(contractorProfileRepository.findByMemberId(CONTRACTOR_ID)).thenReturn(Optional.of(profile));
		when(matchingScoreCalculator.calculate(eq(request), eq(profile)))
				.thenReturn(new MatchingScoreResult(BigDecimal.ZERO, 0, 0, new BigDecimal(matchScoreValue)));

		requestService.assignContractor(REQUEST_ID, CONTRACTOR_ID, LANDLORD_ID);

		verify(analysisJobService).updateMatchingScoreIfExists(REQUEST_ID, expectedScore);
	}

	@Test
	void savesZeroScoreWhenContractorHasNoProfileYet() {
		requestService = new RequestService(quoteRequestRepository, propertyRepository, memberRepository,
				matchingScoreCalculator, contractorProfileRepository, analysisJobService, analysisJobRepository,
				contractorQuoteRepository, notificationService);

		QuoteRequest request = requestWithLandlordOwner();

		when(quoteRequestRepository.findById(REQUEST_ID)).thenReturn(Optional.of(request));
		when(memberRepository.findById(CONTRACTOR_ID)).thenReturn(Optional.of(contractor()));
		when(contractorProfileRepository.findByMemberId(CONTRACTOR_ID)).thenReturn(Optional.empty());

		requestService.assignContractor(REQUEST_ID, CONTRACTOR_ID, LANDLORD_ID);

		verify(analysisJobService).updateMatchingScoreIfExists(REQUEST_ID, 0);
		verify(matchingScoreCalculator, org.mockito.Mockito.never()).calculate(any(), any());
	}

	private QuoteRequest requestWithLandlordOwner() {
		Member landlord = Member.builder().id(LANDLORD_ID).build();
		Property property = Property.builder().owner(landlord).region("광주 북구").build();
		return QuoteRequest.builder().id(REQUEST_ID).owner(landlord).property(property).requestCode("REQ-TEST-000001")
				.build();
	}

	private Member contractor() {
		return Member.builder().id(CONTRACTOR_ID).build();
	}
}
