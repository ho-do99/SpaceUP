package com.spaceup.domain.analysis.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.analysis.dto.AnalysisJobEditRequest;
import com.spaceup.domain.analysis.dto.AnalysisJobResponse;
import com.spaceup.domain.analysis.dto.AnalysisJobResultRequest;
import com.spaceup.domain.analysis.dto.AnalysisSpaceRequest;
import com.spaceup.domain.analysis.dto.AnalysisSpaceResponse;
import com.spaceup.domain.analysis.entity.AnalysisJob;
import com.spaceup.domain.analysis.entity.AnalysisSpace;
import com.spaceup.domain.analysis.entity.AnalysisStatus;
import com.spaceup.domain.analysis.repository.AnalysisJobRepository;
import com.spaceup.domain.analysis.repository.AnalysisSpaceRepository;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.request.repository.RequestContractorRepository;
import com.spaceup.global.error.AnalysisNotFoundException;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.RequestNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalysisJobService {

	private final AnalysisJobRepository analysisJobRepository;
	private final AnalysisSpaceRepository analysisSpaceRepository;
	private final QuoteRequestRepository quoteRequestRepository;
	private final RequestContractorRepository requestContractorRepository;

	// ⭐ PDF "02 임대 정보 입력" 완료 직후 호출 지점. PENDING 상태로 분석 레코드를 먼저 만들어두고, ML 파이프라인에
	// 비동기로 분석을 맡긴 뒤 submitResult()로 콜백을 받는 구조입니다.
	@Transactional
	public Long requestAnalysis(Long requestId, Long landlordId) {
		QuoteRequest request = quoteRequestRepository.findById(requestId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
		validateOwner(request, landlordId);

		AnalysisJob analysis = AnalysisJob.builder().request(request).status(AnalysisStatus.PENDING).build();
		analysisJobRepository.save(analysis);
		return analysis.getId();
	}

	// ⭐ ML 파이프라인 콜백 또는 관리자 수동 보정
	@Transactional
	public void submitResult(Long requestId, AnalysisJobResultRequest dto) {
		AnalysisJob analysis = findByRequestOrThrow(requestId);
		analysis.completeWith(dto.getRoomCount(), dto.getBathroomCount(), dto.getHasBalcony(), dto.getKitchenType(),
				dto.getSpaceScore(), dto.getConditionScore(), dto.getIssueTags(), dto.getEstimatedQuoteMin(),
				dto.getEstimatedQuoteMax(), dto.getPaybackPeriodMonthsMin(), dto.getPaybackPeriodMonthsMax());
	}

	// ⭐ [프론트 연동] "공간 정보 확인" 화면에서 사용자가 방 개수/욕실 개수/발코니 유무/주방 형태/면적을 직접 수정
	@Transactional
	public void updateBasicInfo(Long requestId, Long landlordId, AnalysisJobEditRequest dto) {
		AnalysisJob analysis = findByRequestOrThrow(requestId);
		validateOwner(analysis.getRequest(), landlordId);
		analysis.updateBasicInfo(dto.getRoomCount(), dto.getBathroomCount(), dto.getHasBalcony(),
				dto.getKitchenType(), dto.getCeilingHeightM());
		if (dto.getExclusiveAreaM2() != null) {
			analysis.getRequest().getProperty().updateArea(dto.getExclusiveAreaM2());
		}
	}

	// ⭐ [프론트 연동] "공간 정보 확인" 화면 - 편집한 공간 목록 전체를 교체 저장하고, 시공 선택된 공간들의
	// 바닥/벽지 면적 합계를 다시 계산해 AnalysisJob에 반영합니다.
	@Transactional
	public void replaceSpaces(Long requestId, Long landlordId, List<AnalysisSpaceRequest> spaceRequests) {
		AnalysisJob analysis = findByRequestOrThrow(requestId);
		validateOwner(analysis.getRequest(), landlordId);
		analysisSpaceRepository.deleteByAnalysisJobId(analysis.getId());

		double totalFloorArea = 0;
		double totalWallpaperArea = 0;
		int sortOrder = 0;
		for (AnalysisSpaceRequest spaceRequest : spaceRequests) {
			AnalysisSpace space = AnalysisSpace.builder().analysisJob(analysis).spaceName(spaceRequest.getSpaceName())
					.spaceAreaM2(spaceRequest.getSpaceAreaM2()).floorAreaM2(spaceRequest.getFloorAreaM2())
					.wallpaperAreaM2(spaceRequest.getWallpaperAreaM2())
					.selectedForConstruction(spaceRequest.isSelectedForConstruction()).sortOrder(sortOrder++).build();
			analysisSpaceRepository.save(space);

			if (spaceRequest.isSelectedForConstruction()) {
				totalFloorArea += spaceRequest.getFloorAreaM2() != null ? spaceRequest.getFloorAreaM2() : 0;
				totalWallpaperArea += spaceRequest.getWallpaperAreaM2() != null ? spaceRequest.getWallpaperAreaM2()
						: 0;
			}
		}
		analysis.applyTotalConstructionArea(totalFloorArea, totalWallpaperArea);
	}

	public List<AnalysisSpaceResponse> getSpaces(Long requestId, Long memberId) {
		AnalysisJob analysis = findByRequestOrThrow(requestId);
		validateParticipant(analysis.getRequest(), memberId);
		return analysisSpaceRepository.findByAnalysisJobIdOrderBySortOrderAsc(analysis.getId()).stream()
				.map(AnalysisSpaceResponse::new).collect(Collectors.toList());
	}

	// ⭐ [AnalysisJob 상태 동기화] AI 분석 도중 실패해 호출자(AiFloorplanAnalysisService.analyze())의
	// 트랜잭션이 롤백되더라도, "실패로 표시" 자체는 별도 트랜잭션으로 반드시 커밋되어야 하므로
	// REQUIRES_NEW로 독립시킵니다. REQUIRED로 두면 실패 표시 UPDATE까지 같이 롤백되어 상태가
	// PENDING에 그대로 남는 문제가 있었습니다.
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void markFailed(Long requestId) {
		findByRequestOrThrow(requestId).fail();
	}

	// ⭐ domain/matching의 MatchingScoreCalculator 결과를 여기로 반영
	@Transactional
	public void updateMatchingScore(Long requestId, int score) {
		findByRequestOrThrow(requestId).updateMatchingScore(score);
	}

	// ⭐ 분석 레코드가 아직 없을 수도 있는 시점(예: 시공사 배정이 분석 완료보다 먼저 일어난 경우)에 안전하게 쓰는 버전.
	// 없으면 조용히 무시합니다 (RequestService.assignContractor()에서 사용).
	@Transactional
	public void updateMatchingScoreIfExists(Long requestId, int score) {
		analysisJobRepository.findByRequestId(requestId).ifPresent(analysis -> analysis.updateMatchingScore(score));
	}

	public AnalysisJobResponse getByRequest(Long requestId, Long memberId) {
		AnalysisJob analysis = findByRequestOrThrow(requestId);
		validateParticipant(analysis.getRequest(), memberId);
		return new AnalysisJobResponse(analysis);
	}

	// ⭐ [보안 수정] 본인이 등록한 의뢰만 분석 결과를 수정/재요청할 수 있습니다.
	private void validateOwner(QuoteRequest request, Long landlordId) {
		if (!request.getOwner().getId().equals(landlordId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰의 분석 결과만 처리할 수 있습니다.");
		}
	}

	// ⭐ [보안 수정] 조회는 의뢰의 임대인 본인 또는 배정된 시공사만 가능합니다.
	private void validateParticipant(QuoteRequest request, Long memberId) {
		boolean isOwner = request.getOwner().getId().equals(memberId);
		boolean isContractor = requestContractorRepository
				.existsByRequestIdAndContractorId(request.getId(), memberId);
		if (!isOwner && !isContractor) {
			throw new ForbiddenAccessException("본인이 참여 중인 의뢰의 분석 결과만 조회할 수 있습니다.");
		}
	}

	private AnalysisJob findByRequestOrThrow(Long requestId) {
		return analysisJobRepository.findByRequestId(requestId)
				.orElseThrow(() -> new AnalysisNotFoundException("해당 의뢰의 분석 결과가 없습니다: " + requestId));
	}
}
