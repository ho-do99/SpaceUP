package com.spaceup.domain.analysis.ai.service;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.spaceup.domain.analysis.ai.client.AiFloorplanAnalysisClient;
import com.spaceup.domain.analysis.ai.client.AiFloorplanAnalysisResponse;
import com.spaceup.domain.analysis.ai.client.AiFloorplanRoom;
import com.spaceup.domain.analysis.ai.exception.AiFloorplanAnalysisException;
import com.spaceup.domain.analysis.dto.AnalysisJobResponse;
import com.spaceup.domain.analysis.dto.AnalysisJobResultRequest;
import com.spaceup.domain.analysis.dto.AnalysisSpaceRequest;
import com.spaceup.domain.analysis.service.AnalysisJobService;
import com.spaceup.domain.file.service.ImageStoreService;
import com.spaceup.domain.floorplan.entity.FloorPlanVariant;
import com.spaceup.domain.floorplan.repository.FloorPlanVariantRepository;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestImage;
import com.spaceup.domain.request.entity.RequestImageType;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.request.repository.RequestImageRepository;
import com.spaceup.global.config.ObjectStorageProperties;
import com.spaceup.global.error.FileNotFoundException;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.RequestNotFoundException;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.S3Exception;

// ⭐ [프론트 연동] "평면도 업로드 → AI 분석" 화면. 평면도 이미지를 AI 세그멘테이션/OCR 파이프라인에 보내고,
// 결과(방 이름/개수/욕실개수/발코니유무)를 기존 AnalysisJobService의 콜백 API에 반영합니다.
// 전용면적과 AI 마스크 픽셀 비율로 전용면적 포함 공간의 spaceAreaM2/floorAreaM2를 자동 계산합니다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiFloorplanAnalysisService {

	private final AiFloorplanAnalysisClient aiFloorplanAnalysisClient;
	private final AnalysisJobService analysisJobService;
	private final QuoteRequestRepository quoteRequestRepository;
	private final FloorPlanVariantRepository floorPlanVariantRepository;
	private final RequestImageRepository requestImageRepository;
	private final ImageStoreService imageStoreService;
	private final ObjectStorageProperties objectStorageProperties;
	private final ObjectProvider<S3Client> objectStorageClientProvider;

	@Transactional
	public AnalysisJobResponse analyze(Long requestId, Long landlordId, MultipartFile floorplanImage) {
		if (floorplanImage == null || floorplanImage.isEmpty()) {
			throw new IllegalArgumentException("분석할 평면도 이미지가 없습니다.");
		}
		byte[] imageBytes = readBytes(floorplanImage);
		return analyzeBytes(requestId, landlordId, imageBytes, floorplanImage.getOriginalFilename(),
				floorplanImage.getContentType());
	}

	// ⭐ [Object Storage 등록 평면도 분석] 프론트가 임의의 외부 URL을 보내는 대신 floorPlanVariantId만
	// 넘기면, 백엔드가 등록된 Object Storage key(FloorPlanVariant.floorPlanImageUrl)를 조회해서 직접
	// 이미지를 받아옵니다 - 브라우저가 private bucket에 CORS로 직접 접근할 필요가 없고, 프론트가 임의
	// URL을 지정해 서버가 그 URL로 요청을 보내게 만드는 SSRF 형태의 위험도 원천적으로 없습니다.
	@Transactional
	public AnalysisJobResponse analyzeFromStorage(Long requestId, Long landlordId, Long floorPlanVariantId) {
		FloorPlanVariant variant = floorPlanVariantRepository.findById(floorPlanVariantId)
				.orElseThrow(() -> new FileNotFoundException("존재하지 않는 평면도입니다: " + floorPlanVariantId));
		String objectKey = variant.getFloorPlanImageUrl();
		if (objectKey == null || objectKey.isBlank()) {
			throw new FileNotFoundException("등록된 평면도 이미지가 없습니다: " + floorPlanVariantId);
		}
		byte[] imageBytes = fetchFromObjectStorage(objectKey);
		String filename = objectKey.substring(objectKey.lastIndexOf('/') + 1);
		return analyzeBytes(requestId, landlordId, imageBytes, filename, resolveContentType(filename));
	}

	// ⭐ [평면도 재분석] 이미 request_image(FLOOR_PLAN)로 연결돼 있는 평면도를, 프론트가 원본 파일을 다시
	// 보내지 않고 requestId만으로 재분석할 수 있게 합니다. 같은 requestId에 평면도가 여러 장이면 가장
	// 먼저 등록된 것(sortOrder=0)을 씁니다 - 지금 프론트 흐름상 의뢰당 평면도는 1장이 기본입니다.
	@Transactional
	public AnalysisJobResponse analyzeFromLinkedImage(Long requestId, Long landlordId) {
		List<RequestImage> floorPlanImages = requestImageRepository
				.findByRequestIdAndImageTypeOrderBySortOrderAsc(requestId, RequestImageType.FLOOR_PLAN);
		if (floorPlanImages.isEmpty()) {
			throw new FileNotFoundException("이 의뢰에 연결된 평면도 이미지가 없습니다: " + requestId);
		}
		String imageUrl = floorPlanImages.get(0).getImageUrl();
		String storeFileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
		byte[] imageBytes = readBytesFromResource(imageStoreService.loadAsResource(storeFileName));
		return analyzeBytes(requestId, landlordId, imageBytes, storeFileName, resolveContentType(storeFileName));
	}

	private byte[] readBytesFromResource(Resource resource) {
		try (var input = resource.getInputStream()) {
			return input.readAllBytes();
		} catch (IOException e) {
			throw new AiFloorplanAnalysisException("연결된 평면도 이미지를 읽는 중 오류가 발생했습니다.", e);
		}
	}

	private AnalysisJobResponse analyzeBytes(Long requestId, Long landlordId, byte[] imageBytes, String filename,
			String contentType) {
		QuoteRequest request = quoteRequestRepository.findById(requestId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
		if (!request.getOwner().getId().equals(landlordId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰만 AI 평면도 분석을 요청할 수 있습니다.");
		}
		Double exclusiveAreaM2 = request.getProperty().getExclusiveAreaM2();
		if (exclusiveAreaM2 == null || !Double.isFinite(exclusiveAreaM2) || exclusiveAreaM2 <= 0) {
			throw new IllegalArgumentException("전용면적은 유한한 양수여야 합니다.");
		}

		// ⭐ [AnalysisJob 상태 동기화] AI 호출부터 결과 반영까지 어디서 실패하든 AnalysisJob을 FAILED로
		// 전환합니다. 이전에는 예외가 GlobalExceptionHandler에서 502 등으로 잘 응답되긴 했지만, DB의
		// AnalysisJob.status는 PENDING에 그대로 머물러 있어서 프론트가 재조회해도 실패 여부를 알 수 없었습니다.
		try {
			AiFloorplanAnalysisResponse analysisResponse = aiFloorplanAnalysisClient.analyze(imageBytes, filename,
					contentType);
			List<AiFloorplanRoom> rooms = analysisResponse.rooms();

			int bedroomCount = (int) rooms.stream().filter(AiFloorplanRoom::isBedroom).count();
			int bathroomCount = (int) rooms.stream().filter(AiFloorplanRoom::isBathroom).count();
			boolean hasBalcony = rooms.stream().anyMatch(AiFloorplanRoom::isBalcony);

			AnalysisJobResultRequest result = new AnalysisJobResultRequest();
			result.setRoomCount(bedroomCount);
			result.setBathroomCount(bathroomCount);
			result.setHasBalcony(hasBalcony);
			analysisJobService.submitResult(requestId, result);

			List<AnalysisSpaceRequest> spaceRequests = rooms.stream().map(room -> {
				AnalysisSpaceRequest spaceRequest = new AnalysisSpaceRequest();
				spaceRequest.setSpaceName(room.roomName());
				if (room.includedInTotalArea()) {
					double roomAreaM2 = exclusiveAreaM2 * room.pixelCount() / analysisResponse.totalAreaPixelCount();
					spaceRequest.setSpaceAreaM2(roomAreaM2);
					spaceRequest.setFloorAreaM2(roomAreaM2);
				}
				return spaceRequest;
			}).toList();
			if (!spaceRequests.isEmpty()) {
				analysisJobService.replaceSpaces(requestId, landlordId, spaceRequests);
			}
		} catch (RuntimeException e) {
			markFailedQuietly(requestId);
			throw e;
		}

		return analysisJobService.getByRequest(requestId, landlordId);
	}

	// ⭐ AnalysisJob 행 자체가 없는 경우(사전 생성 누락 등) markFailed()도 실패할 수 있는데, 그 2차 예외가
	// 원래 실패 원인(AI 호출 오류 등)을 가려버리면 안 되므로 여기서 조용히 삼킵니다.
	private void markFailedQuietly(Long requestId) {
		try {
			analysisJobService.markFailed(requestId);
		} catch (RuntimeException ignored) {
			// 원래 예외를 그대로 던지는 것이 더 중요합니다.
		}
	}

	private byte[] readBytes(MultipartFile file) {
		try {
			return file.getBytes();
		} catch (IOException e) {
			throw new AiFloorplanAnalysisException("평면도 이미지를 읽는 중 오류가 발생했습니다.", e);
		}
	}

	private byte[] fetchFromObjectStorage(String objectKey) {
		if (!objectStorageProperties.enabled()) {
			throw new IllegalStateException("Object Storage가 비활성화되어 있어 등록 평면도를 조회할 수 없습니다.");
		}
		S3Client client = objectStorageClientProvider.getIfAvailable();
		if (client == null) {
			throw new IllegalStateException("Object Storage 클라이언트가 설정되지 않았습니다.");
		}
		try {
			return client
					.getObjectAsBytes(
							GetObjectRequest.builder().bucket(objectStorageProperties.bucket()).key(objectKey).build())
					.asByteArray();
		} catch (NoSuchKeyException e) {
			throw new FileNotFoundException("Object Storage에서 평면도 파일을 찾을 수 없습니다: " + objectKey);
		} catch (S3Exception e) {
			if (e.statusCode() == 404) {
				throw new FileNotFoundException("Object Storage에서 평면도 파일을 찾을 수 없습니다: " + objectKey);
			}
			throw new IllegalStateException("Object Storage에서 평면도 파일을 읽는 중 오류가 발생했습니다(권한 오류 가능성 포함).", e);
		}
	}

	private String resolveContentType(String filename) {
		String lower = filename == null ? "" : filename.toLowerCase();
		if (lower.endsWith(".png")) {
			return "image/png";
		}
		if (lower.endsWith(".webp")) {
			return "image/webp";
		}
		return "image/jpeg";
	}
}
