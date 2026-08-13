package com.spaceup.domain.ai.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.ai.dto.InteriorImageGenerateRequest;
import com.spaceup.domain.ai.dto.InteriorImageGenerateResponse;
import com.spaceup.domain.ai.exception.AiImageGenerationInProgressException;
import com.spaceup.domain.ai.provider.GeneratedImage;
import com.spaceup.domain.ai.provider.ImageGenerationProvider;
import com.spaceup.domain.file.service.ImageStoreService;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.request.dto.RequestImageAddRequest;
import com.spaceup.domain.request.dto.RequestImageResponse;
import com.spaceup.domain.request.entity.Property;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestImageType;
import com.spaceup.domain.request.entity.RequestStatus;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.request.service.RequestImageService;

@ExtendWith(MockitoExtension.class)
class AiInteriorImageServiceTest {

	@Mock
	private ImageGenerationProvider imageGenerationProvider;
	@Mock
	private ImageStoreService imageStoreService;
	@Mock
	private QuoteRequestRepository quoteRequestRepository;
	@Mock
	private RequestImageService requestImageService;

	private AiInteriorImageService service;

	@BeforeEach
	void setUp() {
		service = new AiInteriorImageService(imageGenerationProvider, imageStoreService, quoteRequestRepository,
				requestImageService);
	}

	@Test
	void generatedObjectStoragePathIsConnectedToRequestAsAiGeneratedImage() {
		Member owner = Member.builder().id(1L).password("encoded").email("owner@test.com")
				.name("임대인").role(MemberRole.LANDLORD).build();
		Property property = Property.builder().id(2L).owner(owner).region("광주").housingType("아파트")
				.exclusiveAreaM2(84.0).build();
		QuoteRequest quoteRequest = QuoteRequest.builder().id(7L).owner(owner).property(property)
				.status(RequestStatus.REVIEWING).build();

		when(quoteRequestRepository.findById(7L)).thenReturn(Optional.of(quoteRequest));
		when(imageGenerationProvider.generate(anyString(), any()))
				.thenReturn(List.of(new GeneratedImage(new byte[] { 1, 2, 3 }, "image/png")));
		when(imageStoreService.storeBytes(any(byte[].class), anyString())).thenReturn("generated.png");

		InteriorImageGenerateRequest request = new InteriorImageGenerateRequest();
		request.setStyle("모던");
		InteriorImageGenerateResponse response = service.generate(7L, 1L, request);

		assertEquals(List.of("/api/files/images/generated.png"), response.imageUrls());
		ArgumentCaptor<RequestImageAddRequest> imageCaptor = ArgumentCaptor.forClass(RequestImageAddRequest.class);
		verify(requestImageService).addImage(org.mockito.ArgumentMatchers.eq(7L),
				org.mockito.ArgumentMatchers.eq(1L), imageCaptor.capture());
		assertEquals(RequestImageType.AI_GENERATED, imageCaptor.getValue().getImageType());
		assertEquals("/api/files/images/generated.png", imageCaptor.getValue().getImageUrl());
	}

	@Test
	void getGeneratedImagesReturnsAlreadyStoredAiGeneratedImages() {
		Member owner = Member.builder().id(1L).password("encoded").email("owner@test.com")
				.name("임대인").role(MemberRole.LANDLORD).build();
		Property property = Property.builder().id(2L).owner(owner).region("광주").housingType("아파트")
				.exclusiveAreaM2(84.0).build();
		QuoteRequest quoteRequest = QuoteRequest.builder().id(7L).owner(owner).property(property)
				.status(RequestStatus.REVIEWING).build();

		when(quoteRequestRepository.findById(7L)).thenReturn(Optional.of(quoteRequest));
		when(requestImageService.getImages(7L, RequestImageType.AI_GENERATED, 1L))
				.thenReturn(List.of(new RequestImageResponse(10L, RequestImageType.AI_GENERATED,
						"/api/files/images/a.png", 0)));

		InteriorImageGenerateResponse response = service.getGeneratedImages(7L, 1L);

		assertEquals(List.of("/api/files/images/a.png"), response.imageUrls());
	}

	// ⭐ [중복 생성 방지] 첫 번째 생성이 아직 진행 중일 때 같은 requestId로 두 번째 요청이 들어오면
	// 409(AiImageGenerationInProgressException)로 바로 거절되는지 확인합니다.
	@Test
	void rejectsConcurrentGenerateRequestsForSameRequestId() throws Exception {
		Member owner = Member.builder().id(1L).password("encoded").email("owner@test.com")
				.name("임대인").role(MemberRole.LANDLORD).build();
		Property property = Property.builder().id(2L).owner(owner).region("광주").housingType("아파트")
				.exclusiveAreaM2(84.0).build();
		QuoteRequest quoteRequest = QuoteRequest.builder().id(7L).owner(owner).property(property)
				.status(RequestStatus.REVIEWING).build();
		when(quoteRequestRepository.findById(7L)).thenReturn(Optional.of(quoteRequest));

		CountDownLatch enteredProvider = new CountDownLatch(1);
		CountDownLatch releaseProvider = new CountDownLatch(1);
		when(imageGenerationProvider.generate(anyString(), any())).thenAnswer(invocation -> {
			enteredProvider.countDown();
			releaseProvider.await(5, TimeUnit.SECONDS);
			return List.of(new GeneratedImage(new byte[] { 1 }, "image/png"));
		});
		when(imageStoreService.storeBytes(any(byte[].class), anyString())).thenReturn("generated.png");

		InteriorImageGenerateRequest request = new InteriorImageGenerateRequest();
		request.setStyle("모던");

		ExecutorService executor = Executors.newSingleThreadExecutor();
		try {
			var firstCall = executor.submit(() -> service.generate(7L, 1L, request));
			enteredProvider.await(5, TimeUnit.SECONDS);

			assertThatThrownBy(() -> service.generate(7L, 1L, request))
					.isInstanceOf(AiImageGenerationInProgressException.class);

			releaseProvider.countDown();
			firstCall.get(5, TimeUnit.SECONDS);

			// 첫 호출이 끝난 뒤에는 잠금이 풀려서 다시 생성 요청이 가능해야 합니다.
			InteriorImageGenerateResponse afterCompletion = service.generate(7L, 1L, request);
			assertEquals(List.of("/api/files/images/generated.png"), afterCompletion.imageUrls());
		} finally {
			executor.shutdownNow();
		}
	}
}
