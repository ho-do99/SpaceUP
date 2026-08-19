package com.spaceup.domain.analysis.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.analysis.dto.AnalysisSpaceRequest;
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

	@Test
	void replacingSpacesFlushesDeletedRowsBeforeReusingTheirSortOrders() {
		Member owner = Member.builder().id(100L).password("encoded").email("owner@test.com")
				.name("임대인").role(MemberRole.LANDLORD).build();
		QuoteRequest request = QuoteRequest.builder().id(7L).owner(owner).status(RequestStatus.NEW).build();
		AnalysisJob analysis = AnalysisJob.builder().id(55L).request(request).status(AnalysisStatus.COMPLETED).build();
		AnalysisSpaceRequest space = new AnalysisSpaceRequest();
		space.setSpaceName("거실");
		space.setSpaceAreaM2(24.0);
		space.setFloorAreaM2(24.0);
		space.setWallpaperAreaM2(36.0);
		space.setSelectedForConstruction(true);
		when(analysisJobRepository.findByRequestId(7L)).thenReturn(Optional.of(analysis));

		service.replaceSpaces(7L, 100L, List.of(space));

		InOrder persistenceOrder = inOrder(analysisSpaceRepository);
		persistenceOrder.verify(analysisSpaceRepository).deleteByAnalysisJobId(55L);
		persistenceOrder.verify(analysisSpaceRepository).flush();
		persistenceOrder.verify(analysisSpaceRepository).save(any());
	}

	@Test
	void selectedSpacesDeriveWallpaperAreaFromFloorAreaAndDefaultCeilingHeight() {
		Member owner = Member.builder().id(100L).password("encoded").email("owner@test.com")
				.name("임대인").role(MemberRole.LANDLORD).build();
		QuoteRequest request = QuoteRequest.builder().id(7L).owner(owner).status(RequestStatus.NEW).build();
		AnalysisJob analysis = AnalysisJob.builder().id(55L).request(request).status(AnalysisStatus.COMPLETED).build();
		AnalysisSpaceRequest selected = new AnalysisSpaceRequest();
		selected.setSpaceName("거실");
		selected.setSpaceAreaM2(25.0);
		selected.setFloorAreaM2(25.0);
		selected.setSelectedForConstruction(true);
		AnalysisSpaceRequest excluded = new AnalysisSpaceRequest();
		excluded.setSpaceName("침실");
		excluded.setSpaceAreaM2(9.0);
		excluded.setFloorAreaM2(9.0);
		excluded.setSelectedForConstruction(false);
		when(analysisJobRepository.findByRequestId(7L)).thenReturn(Optional.of(analysis));

		service.replaceSpaces(7L, 100L, List.of(selected, excluded));

		assertThat(analysis.getTotalFloorAreaM2()).isEqualTo(25.0);
		assertThat(analysis.getTotalWallpaperAreaM2()).isEqualTo(40.8);
		verify(analysisSpaceRepository).save(org.mockito.ArgumentMatchers.argThat(space ->
				space.getSpaceName().equals("거실") && space.getWallpaperAreaM2().equals(40.8)));
	}
}
