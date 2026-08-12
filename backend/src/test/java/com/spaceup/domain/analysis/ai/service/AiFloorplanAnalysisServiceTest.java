package com.spaceup.domain.analysis.ai.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import com.spaceup.domain.analysis.ai.client.AiFloorplanAnalysisClient;
import com.spaceup.domain.analysis.ai.client.AiFloorplanAnalysisResponse;
import com.spaceup.domain.analysis.ai.client.AiFloorplanRoom;
import com.spaceup.domain.analysis.dto.AnalysisSpaceRequest;
import com.spaceup.domain.analysis.service.AnalysisJobService;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.request.entity.Property;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestStatus;
import com.spaceup.domain.request.repository.QuoteRequestRepository;

@ExtendWith(MockitoExtension.class)
class AiFloorplanAnalysisServiceTest {

	@Mock
	private AiFloorplanAnalysisClient aiFloorplanAnalysisClient;
	@Mock
	private AnalysisJobService analysisJobService;
	@Mock
	private QuoteRequestRepository quoteRequestRepository;

	private AiFloorplanAnalysisService service;

	@BeforeEach
	void setUp() {
		service = new AiFloorplanAnalysisService(aiFloorplanAnalysisClient, analysisJobService, quoteRequestRepository);
	}

	@Test
	void calculatesRoomAreaFromExclusiveAreaAndPixelRatio() {
		Member owner = Member.builder().id(1L).password("encoded").email("owner@test.com")
				.name("임대인").role(MemberRole.LANDLORD).build();
		Property property = Property.builder().id(2L).owner(owner).region("광주").housingType("아파트")
				.exclusiveAreaM2(84.0).build();
		QuoteRequest quoteRequest = QuoteRequest.builder().id(7L).owner(owner).property(property)
				.status(RequestStatus.NEW).build();
		MockMultipartFile floorplan = new MockMultipartFile("file", "plan.png", "image/png", new byte[] { 1 });

		when(quoteRequestRepository.findById(7L)).thenReturn(Optional.of(quoteRequest));
		when(aiFloorplanAnalysisClient.analyze(any(byte[].class), anyString(), anyString()))
				.thenReturn(new AiFloorplanAnalysisResponse(3000,
						List.of(new AiFloorplanRoom("거실", 4, 1000, true),
								new AiFloorplanRoom("발코니", 8, 500, false))));

		service.analyze(7L, 1L, floorplan);

		@SuppressWarnings("unchecked")
		ArgumentCaptor<List<AnalysisSpaceRequest>> spacesCaptor = ArgumentCaptor.forClass(List.class);
		verify(analysisJobService).replaceSpaces(anyLong(), anyLong(), spacesCaptor.capture());
		AnalysisSpaceRequest livingRoom = spacesCaptor.getValue().getFirst();
		assertThat(livingRoom.getSpaceAreaM2()).isEqualTo(28.0);
		assertThat(livingRoom.getFloorAreaM2()).isEqualTo(28.0);
		AnalysisSpaceRequest balcony = spacesCaptor.getValue().get(1);
		assertThat(balcony.getSpaceAreaM2()).isNull();
		assertThat(balcony.getFloorAreaM2()).isNull();
	}

	@Test
	void rejectsNonPositiveExclusiveAreaBeforeCallingAi() {
		Member owner = Member.builder().id(1L).password("encoded").email("owner@test.com")
				.name("임대인").role(MemberRole.LANDLORD).build();
		Property property = Property.builder().id(2L).owner(owner).region("광주").housingType("아파트")
				.exclusiveAreaM2(0.0).build();
		QuoteRequest quoteRequest = QuoteRequest.builder().id(7L).owner(owner).property(property)
				.status(RequestStatus.NEW).build();
		MockMultipartFile floorplan = new MockMultipartFile("file", "plan.png", "image/png", new byte[] { 1 });
		when(quoteRequestRepository.findById(7L)).thenReturn(Optional.of(quoteRequest));

		assertThatThrownBy(() -> service.analyze(7L, 1L, floorplan))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("전용면적");
	}
}
