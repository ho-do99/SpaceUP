package com.spaceup.domain.analysis.ai.service;

import java.io.IOException;
import java.util.List;

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
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.RequestNotFoundException;

import lombok.RequiredArgsConstructor;

// ⭐ [프론트 연동] "평면도 업로드 → AI 분석" 화면. 평면도 이미지를 AI 세그멘테이션/OCR 파이프라인에 보내고,
// 결과(방 이름/개수/욕실개수/발코니유무)를 기존 AnalysisJobService의 콜백 API에 그대로 반영합니다.
// ⚠️ AI 파이프라인이 픽셀 단위 데이터만 반환하고 m² 실면적을 계산하지 않아서, 공간별 면적(spaceAreaM2 등)은
// 채우지 못합니다 - 사용자가 "공간 정보 확인" 화면에서 직접 입력/수정해야 합니다(기존 PATCH/PUT API 그대로 사용).
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiFloorplanAnalysisService {

	private final AiFloorplanAnalysisClient aiFloorplanAnalysisClient;
	private final AnalysisJobService analysisJobService;
	private final QuoteRequestRepository quoteRequestRepository;

	@Transactional
	public AnalysisJobResponse analyze(Long requestId, Long landlordId, MultipartFile floorplanImage) {
		QuoteRequest request = quoteRequestRepository.findById(requestId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
		if (!request.getOwner().getId().equals(landlordId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰만 AI 평면도 분석을 요청할 수 있습니다.");
		}
		if (floorplanImage == null || floorplanImage.isEmpty()) {
			throw new IllegalArgumentException("분석할 평면도 이미지가 없습니다.");
		}

		byte[] imageBytes = readBytes(floorplanImage);
		AiFloorplanAnalysisResponse analysisResponse = aiFloorplanAnalysisClient.analyze(imageBytes,
				floorplanImage.getOriginalFilename(), floorplanImage.getContentType());
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
			// ⭐ AI가 m² 면적을 계산하지 못하므로 면적 필드는 비워둡니다 - 사용자가 이후 직접 입력합니다.
			return spaceRequest;
		}).toList();
		if (!spaceRequests.isEmpty()) {
			analysisJobService.replaceSpaces(requestId, landlordId, spaceRequests);
		}

		return analysisJobService.getByRequest(requestId, landlordId);
	}

	private byte[] readBytes(MultipartFile file) {
		try {
			return file.getBytes();
		} catch (IOException e) {
			throw new AiFloorplanAnalysisException("평면도 이미지를 읽는 중 오류가 발생했습니다.", e);
		}
	}
}
