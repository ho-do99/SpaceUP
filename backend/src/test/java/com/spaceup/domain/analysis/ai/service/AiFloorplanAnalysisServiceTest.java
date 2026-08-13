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
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.web.MockMultipartFile;

import com.spaceup.domain.analysis.ai.client.AiFloorplanAnalysisClient;
import com.spaceup.domain.analysis.ai.client.AiFloorplanAnalysisResponse;
import com.spaceup.domain.analysis.ai.client.AiFloorplanRoom;
import com.spaceup.domain.analysis.ai.exception.AiFloorplanAnalysisException;
import com.spaceup.domain.analysis.dto.AnalysisSpaceRequest;
import com.spaceup.domain.analysis.service.AnalysisJobService;
import com.spaceup.domain.floorplan.entity.FloorPlanVariant;
import com.spaceup.domain.floorplan.repository.FloorPlanVariantRepository;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.request.entity.Property;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestStatus;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.global.config.ObjectStorageProperties;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

@ExtendWith(MockitoExtension.class)
class AiFloorplanAnalysisServiceTest {

	@Mock
	private AiFloorplanAnalysisClient aiFloorplanAnalysisClient;
	@Mock
	private AnalysisJobService analysisJobService;
	@Mock
	private QuoteRequestRepository quoteRequestRepository;
	@Mock
	private FloorPlanVariantRepository floorPlanVariantRepository;
	@Mock
	private com.spaceup.domain.request.repository.RequestImageRepository requestImageRepository;
	@Mock
	private com.spaceup.domain.file.service.ImageStoreService imageStoreService;
	@Mock
	private ObjectProvider<S3Client> objectStorageClientProvider;

	private AiFloorplanAnalysisService service;

	@BeforeEach
	void setUp() {
		ObjectStorageProperties objectStorageProperties = new ObjectStorageProperties(false, null, null, null, null,
				null);
		service = new AiFloorplanAnalysisService(aiFloorplanAnalysisClient, analysisJobService,
				quoteRequestRepository, floorPlanVariantRepository, requestImageRepository, imageStoreService,
				objectStorageProperties, objectStorageClientProvider);
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

	@Test
	void marksAnalysisJobFailedWhenAiCallThrows() {
		Member owner = Member.builder().id(1L).password("encoded").email("owner@test.com")
				.name("임대인").role(MemberRole.LANDLORD).build();
		Property property = Property.builder().id(2L).owner(owner).region("광주").housingType("아파트")
				.exclusiveAreaM2(84.0).build();
		QuoteRequest quoteRequest = QuoteRequest.builder().id(7L).owner(owner).property(property)
				.status(RequestStatus.NEW).build();
		MockMultipartFile floorplan = new MockMultipartFile("file", "plan.png", "image/png", new byte[] { 1 });

		when(quoteRequestRepository.findById(7L)).thenReturn(Optional.of(quoteRequest));
		when(aiFloorplanAnalysisClient.analyze(any(byte[].class), anyString(), anyString()))
				.thenThrow(new AiFloorplanAnalysisException("AI 서버 호출 실패"));

		assertThatThrownBy(() -> service.analyze(7L, 1L, floorplan)).isInstanceOf(AiFloorplanAnalysisException.class);

		verify(analysisJobService).markFailed(7L);
	}

	@Test
	void analyzeFromStorageLooksUpVariantKeyAndReusesSameFlow() {
		Member owner = Member.builder().id(1L).password("encoded").email("owner@test.com")
				.name("임대인").role(MemberRole.LANDLORD).build();
		Property property = Property.builder().id(2L).owner(owner).region("광주").housingType("아파트")
				.exclusiveAreaM2(84.0).build();
		QuoteRequest quoteRequest = QuoteRequest.builder().id(7L).owner(owner).property(property)
				.status(RequestStatus.NEW).build();
		FloorPlanVariant variant = FloorPlanVariant.builder().id(99L).exclusiveAreaM2(84.0)
				.floorPlanImageUrl("floorplans/99.jpg").build();

		when(floorPlanVariantRepository.findById(99L)).thenReturn(Optional.of(variant));

		// Object Storage가 꺼져 있으면 fetchFromObjectStorage()가 바로 IllegalStateException을 던져야
		// 합니다(존재하지 않는 설정으로 실제 S3 호출을 시도하면 안 됨).
		assertThatThrownBy(() -> service.analyzeFromStorage(7L, 1L, 99L)).isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("Object Storage");
	}

	@Test
	void analyzeFromStorageDownloadsRegisteredObjectAndSendsItsBytesToAi() {
		S3Client objectStorageClient = org.mockito.Mockito.mock(S3Client.class);
		ObjectStorageProperties properties = new ObjectStorageProperties(true, "https://kr.object.ncloudstorage.com",
				"kr-standard", "spaceup", "access", "secret");
		service = new AiFloorplanAnalysisService(aiFloorplanAnalysisClient, analysisJobService,
				quoteRequestRepository, floorPlanVariantRepository, requestImageRepository, imageStoreService,
				properties, objectStorageClientProvider);
		Member owner = Member.builder().id(1L).password("encoded").email("owner@test.com")
				.name("owner").role(MemberRole.LANDLORD).build();
		Property property = Property.builder().id(2L).owner(owner).region("Gwangju").housingType("APARTMENT")
				.exclusiveAreaM2(84.0).build();
		QuoteRequest quoteRequest = QuoteRequest.builder().id(7L).owner(owner).property(property)
				.status(RequestStatus.NEW).build();
		FloorPlanVariant variant = FloorPlanVariant.builder().id(99L).exclusiveAreaM2(84.0)
				.floorPlanImageUrl("floorplans/floorplan1.png").build();
		byte[] storedImage = new byte[] { 1, 2, 3 };

		when(floorPlanVariantRepository.findById(99L)).thenReturn(Optional.of(variant));
		when(objectStorageClientProvider.getIfAvailable()).thenReturn(objectStorageClient);
		when(objectStorageClient.getObjectAsBytes(any(software.amazon.awssdk.services.s3.model.GetObjectRequest.class)))
				.thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), storedImage));
		when(quoteRequestRepository.findById(7L)).thenReturn(Optional.of(quoteRequest));
		when(aiFloorplanAnalysisClient.analyze(storedImage, "floorplan1.png", "image/png"))
				.thenReturn(new AiFloorplanAnalysisResponse(1000,
						List.of(new AiFloorplanRoom("living room", 4, 1000, true))));

		service.analyzeFromStorage(7L, 1L, 99L);

		verify(aiFloorplanAnalysisClient).analyze(storedImage, "floorplan1.png", "image/png");
		verify(analysisJobService).submitResult(org.mockito.ArgumentMatchers.eq(7L), any());
	}

	@Test
	void analyzeFromLinkedImageThrowsWhenNoFloorPlanIsAttached() {
		when(requestImageRepository.findByRequestIdAndImageTypeOrderBySortOrderAsc(7L,
				com.spaceup.domain.request.entity.RequestImageType.FLOOR_PLAN)).thenReturn(List.of());

		assertThatThrownBy(() -> service.analyzeFromLinkedImage(7L, 1L))
				.isInstanceOf(com.spaceup.global.error.FileNotFoundException.class)
				.hasMessageContaining("연결된 평면도");
	}

	@Test
	void analyzeFromLinkedImageReusesStoredImageBytesWithoutReupload() {
		Member owner = Member.builder().id(1L).password("encoded").email("owner@test.com")
				.name("임대인").role(MemberRole.LANDLORD).build();
		Property property = Property.builder().id(2L).owner(owner).region("광주").housingType("아파트")
				.exclusiveAreaM2(84.0).build();
		QuoteRequest quoteRequest = QuoteRequest.builder().id(7L).owner(owner).property(property)
				.status(RequestStatus.NEW).build();
		com.spaceup.domain.request.entity.RequestImage linkedImage = com.spaceup.domain.request.entity.RequestImage
				.builder().id(500L).request(quoteRequest)
				.imageType(com.spaceup.domain.request.entity.RequestImageType.FLOOR_PLAN)
				.imageUrl("/api/files/images/abc123.png").sortOrder(0).build();

		when(requestImageRepository.findByRequestIdAndImageTypeOrderBySortOrderAsc(7L,
				com.spaceup.domain.request.entity.RequestImageType.FLOOR_PLAN)).thenReturn(List.of(linkedImage));
		when(imageStoreService.loadAsResource("abc123.png"))
				.thenReturn(new org.springframework.core.io.ByteArrayResource(new byte[] { 1, 2, 3 }));
		when(quoteRequestRepository.findById(7L)).thenReturn(Optional.of(quoteRequest));
		when(aiFloorplanAnalysisClient.analyze(any(byte[].class), anyString(), anyString()))
				.thenReturn(new AiFloorplanAnalysisResponse(1000, List.of(new AiFloorplanRoom("거실", 4, 1000, true))));

		service.analyzeFromLinkedImage(7L, 1L);

		verify(imageStoreService).loadAsResource("abc123.png");
		verify(analysisJobService).submitResult(org.mockito.ArgumentMatchers.eq(7L), any());
	}
}
