package com.spaceup.domain.analysis.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.analysis.entity.AnalysisJob;
import com.spaceup.domain.analysis.entity.AnalysisStatus;
import com.spaceup.domain.analysis.repository.AnalysisJobRepository;
import com.spaceup.domain.analysis.repository.AnalysisSpaceRepository;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestStatus;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.request.repository.RequestContractorRepository;

@ExtendWith(MockitoExtension.class)
class AnalysisJobServiceIdempotencyTest {

	@Mock
	private AnalysisJobRepository analysisJobRepository;
	@Mock
	private AnalysisSpaceRepository analysisSpaceRepository;
	@Mock
	private QuoteRequestRepository quoteRequestRepository;
	@Mock
	private RequestContractorRepository requestContractorRepository;

	private AnalysisJobService service;

	@BeforeEach
	void setUp() {
		service = new AnalysisJobService(analysisJobRepository, analysisSpaceRepository,
				quoteRequestRepository, requestContractorRepository);
	}

	@Test
	void repeatedAnalysisRequestReturnsTheExistingJobIdWithoutCreatingAnotherRow() {
		Member owner = Member.builder().id(100L).password("encoded").email("owner@test.com")
				.name("임대인").role(MemberRole.LANDLORD).build();
		QuoteRequest request = QuoteRequest.builder().id(7L).owner(owner).status(RequestStatus.NEW).build();
		AnalysisJob existing = AnalysisJob.builder().id(55L).request(request).status(AnalysisStatus.PENDING).build();
		when(quoteRequestRepository.findByIdForUpdate(7L)).thenReturn(Optional.of(request));
		when(analysisJobRepository.findByRequestId(7L)).thenReturn(Optional.of(existing));

		Long analysisJobId = service.requestAnalysis(7L, 100L);

		assertThat(analysisJobId).isEqualTo(55L);
		verify(analysisJobRepository, never()).save(org.mockito.ArgumentMatchers.any(AnalysisJob.class));
	}
}
