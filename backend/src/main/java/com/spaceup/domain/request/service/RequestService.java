package com.spaceup.domain.request.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.analysis.entity.AnalysisJob;
import com.spaceup.domain.analysis.repository.AnalysisJobRepository;
import com.spaceup.domain.analysis.service.AnalysisJobService;
import com.spaceup.domain.contractor.repository.ContractorProfileRepository;
import com.spaceup.domain.floorplan.entity.FloorPlanVariant;
import com.spaceup.domain.floorplan.repository.FloorPlanVariantRepository;
import com.spaceup.domain.matching.service.MatchingScoreCalculator;
import com.spaceup.domain.material.entity.MaterialProduct;
import com.spaceup.domain.material.entity.MaterialTheme;
import com.spaceup.domain.material.entity.MaterialWorkType;
import com.spaceup.domain.material.repository.MaterialProductRepository;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.entity.NotificationType;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.quote.entity.ContractorQuote;
import com.spaceup.domain.quote.entity.QuoteStatus;
import com.spaceup.domain.quote.repository.ContractorQuoteRepository;
import com.spaceup.domain.request.dto.RequestCreateRequest;
import com.spaceup.domain.request.dto.RequestResponse;
import com.spaceup.domain.request.dto.RequestUpdateRequest;
import com.spaceup.domain.request.entity.Property;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RejectReason;
import com.spaceup.domain.request.entity.RequestContractor;
import com.spaceup.domain.request.entity.RequestContractorStatus;
import com.spaceup.domain.request.entity.RequestStatus;
import com.spaceup.domain.request.repository.PropertyRepository;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.request.repository.RequestContractorRepository;
import com.spaceup.domain.visit.service.SiteVisitService;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.InvalidStatusTransitionException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.RequestNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RequestService {

	private final QuoteRequestRepository quoteRequestRepository;
	private final RequestContractorRepository requestContractorRepository;
	private final PropertyRepository propertyRepository;
	private final MemberRepository memberRepository;
	private final MatchingScoreCalculator matchingScoreCalculator;
	private final ContractorProfileRepository contractorProfileRepository;
	private final FloorPlanVariantRepository floorPlanVariantRepository;
	private final AnalysisJobService analysisJobService;
	private final AnalysisJobRepository analysisJobRepository;
	private final ContractorQuoteRepository contractorQuoteRepository;
	private final NotificationService notificationService;
	private final SiteVisitService siteVisitService;
	private final MaterialProductRepository materialProductRepository;

	// ⭐ PDF "02 임대 정보 입력" 완료 시 호출. AI 분석은 domain/analysis 쪽에서 별도로 요청합니다
	// (AnalysisJobService.requestAnalysis - 컨트롤러 레벨에서 이어 호출). 매물(Property)과 견적요청
	// (QuoteRequest)이 PDF 구조대로 분리되어 있어서 여기서 두 단계로 저장합니다.
	@Transactional
	public Long createRequest(Long landlordId, RequestCreateRequest dto) {
		Member landlord = memberRepository.findById(landlordId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + landlordId));

		Property property = Property.builder().owner(landlord).region(dto.getRegion())
				.housingType(dto.getPropertyType()).exclusiveAreaM2(dto.getAreaM2()).currentDeposit(dto.getDeposit())
				.currentMonthlyRent(dto.getMonthlyRent()).build();
		propertyRepository.save(property);

		QuoteRequest request = QuoteRequest.builder().owner(landlord).property(property).targetRent(dto.getTargetRent())
				.budget(dto.getBudget()).budgetMin(dto.getBudgetMin()).budgetMax(dto.getBudgetMax())
				.desiredDate(dto.getDesiredDate()).requestedItems(dto.getRequestedItems()).status(RequestStatus.NEW)
				.build();

		// ⭐ IDENTITY 전략이라 save() 시점에 DB가 id를 즉시 발급합니다. count()+1 방식과 달리 동시 요청 두 개가
		// 같은 코드를 받을 수 없어요 (id 자체가 DB가 보장하는 유일값이라서).
		quoteRequestRepository.save(request);
		request.assignCode(generateRequestCode(request.getId()));
		request.touch(); // ⭐ 생성 시점부터 자동취소 타이머 시작

		return request.getId();
	}

	// ⭐ [프론트 연동] PATCH /api/requests/{requestId} - 화면 뒤쪽 단계(예산/희망일정/요청항목)에서 값이
	// 채워지는 필드들을 나중에 저장. 본인이 등록한 의뢰만 수정 가능합니다.
	@Transactional
	public void updateRequest(Long requestId, Long landlordId, RequestUpdateRequest dto) {
		QuoteRequest request = findRequestOrThrow(requestId);
		if (!request.getOwner().getId().equals(landlordId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰만 수정할 수 있습니다.");
		}
		request.getProperty().updatePartial(dto.getRegion(), dto.getPropertyType(), dto.getAreaM2(), dto.getDeposit(),
				dto.getMonthlyRent());
		request.updatePartial(dto.getTargetRent(), dto.getBudgetMin(), dto.getBudgetMax(), dto.getDesiredDate(),
				dto.getRequestedItems());
		MaterialProduct wallpaper = resolveSelectedMaterial(dto.getSelectedWallpaperProductId(),
				MaterialWorkType.WALLPAPER, dto.getSelectedTheme());
		MaterialProduct flooring = resolveSelectedMaterial(dto.getSelectedFlooringProductId(),
				MaterialWorkType.FLOORING, dto.getSelectedTheme());
		MaterialProduct lighting = resolveSelectedMaterial(dto.getSelectedLightingProductId(),
				MaterialWorkType.LIGHTING, dto.getSelectedTheme());
		request.updateMaterialSelection(dto.getSelectedTheme(), wallpaper, flooring, lighting);
		request.touch();
	}

	private MaterialProduct resolveSelectedMaterial(Long productId, MaterialWorkType expectedWorkType,
			MaterialTheme selectedTheme) {
		if (productId == null) {
			return null;
		}
		MaterialProduct product = materialProductRepository.findById(productId)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 자재입니다: " + productId));
		if (!product.isActive()) {
			throw new IllegalArgumentException("현재 선택할 수 없는 자재입니다: " + productId);
		}
		if (product.getWorkType() != expectedWorkType) {
			throw new IllegalArgumentException("선택한 자재의 시공 종류가 올바르지 않습니다: " + productId);
		}
		if (selectedTheme != null && product.getTheme() != selectedTheme) {
			throw new IllegalArgumentException("선택한 테마와 자재 테마가 일치하지 않습니다: " + productId);
		}
		return product;
	}

	// ⭐ [보안 수정] 의뢰의 임대인 본인 또는 배정된 시공사만 상세를 조회할 수 있습니다.
	public RequestResponse getRequest(Long requestId, Long memberId) {
		QuoteRequest request = findRequestOrThrow(requestId);
		boolean isOwner = request.getOwner().getId().equals(memberId);
		RequestContractor participation = requestContractorRepository
				.findByRequestIdAndContractorId(requestId, memberId).orElse(null);
		boolean isContractor = participation != null;
		if (!isOwner && !isContractor) {
			throw new ForbiddenAccessException("본인이 참여 중인 의뢰만 조회할 수 있습니다.");
		}
		return toResponse(request, participation != null ? participation.getStatus() : null,
				participation != null ? participation.getMatchingScore() : lookupMatchingScore(requestId), isOwner);
	}

	// ⭐ PDF "의뢰 목록" 화면 - 시공사 관점 (페이지네이션)
	public Page<RequestResponse> getRequestsForContractor(Long contractorId, Pageable pageable) {
		return requestContractorRepository.findByContractorId(contractorId, pageable)
				.map(participation -> toResponse(participation.getRequest(), participation.getStatus(),
						participation.getMatchingScore(), false));
	}

	// ⭐ PDF "마이페이지 - 견적 요청 내역" 화면 - 임대인 관점 (페이지네이션)
	public Page<RequestResponse> getRequestsForLandlord(Long landlordId, Pageable pageable) {
		return quoteRequestRepository.findByOwnerId(landlordId, pageable)
				.map(request -> toResponse(request, null, lookupMatchingScore(request.getId()), true));
	}

	// ⭐ 임대인이 특정 시공사에게 견적을 요청하는 순간(PDF 08 견적 요청) 시공사가 매칭됩니다. 본인이 등록한 의뢰만 배정
	// 가능하며, 매칭점수 계산 + 알림 발송까지 이 시점에 한꺼번에 처리합니다.
	// ⭐ [보안 수정] 견적요청/시공진행/완료 단계로 넘어간 의뢰를 다시 배정해 상태를 되돌리는 것을 막습니다.
	// 아직 시공사가 응답하지 않았거나(NEW/REVIEWING) 거절/취소된 의뢰는 다른 시공사로 재배정할 수 있습니다.
	private static final Set<RequestStatus> ASSIGNABLE_STATUSES = EnumSet.of(RequestStatus.NEW,
			RequestStatus.REVIEWING, RequestStatus.QUOTE_REQUESTED);

	@Transactional
	public void assignContractor(Long requestId, Long contractorId, Long landlordId) {
		QuoteRequest request = findRequestOrThrow(requestId);
		if (!request.getOwner().getId().equals(landlordId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰만 시공사를 배정할 수 있습니다.");
		}
		if (!ASSIGNABLE_STATUSES.contains(request.getStatus())) {
			throw new InvalidStatusTransitionException(
					String.format("현재 상태(%s)에서는 시공사를 배정할 수 없습니다.", request.getStatus()));
		}
		Member contractor = memberRepository.findById(contractorId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 시공사입니다: " + contractorId));
		if (requestContractorRepository.existsByRequestIdAndContractorId(requestId, contractorId)) {
			throw new InvalidStatusTransitionException("이미 견적 참여를 요청한 시공사입니다.");
		}
		RequestContractor participation = RequestContractor.builder().request(request).contractor(contractor)
				.status(RequestContractorStatus.INVITED).build();
		requestContractorRepository.save(participation);
		request.markReviewing();
		request.touch();

		// ⭐ [시공사 추천 점수 고도화] 프로필을 아직 등록 안 한 시공사(견적범위/가능일 미입력)는 점수를 매길 근거가
		// 없어 0점으로 저장합니다(기존 MatchingScoreCalculator 내부 조회 실패 시 0점 처리하던 것과 동일한 동작).
		BigDecimal matchScore = contractorProfileRepository.findByMemberId(contractorId)
				.map(profile -> matchingScoreCalculator.calculate(request, profile).matchScore())
				.orElse(BigDecimal.ZERO);
		int score = matchScore.setScale(0, RoundingMode.HALF_UP).intValue();
		participation.updateMatchingScore(score);
		analysisJobService.updateMatchingScoreIfExists(requestId, score);

		notificationService.notify(contractorId, NotificationType.REQUEST, "새 의뢰가 도착했습니다",
				String.format("%s(%s) 의뢰가 배정되었습니다. 매칭 점수 %d점", request.getRequestCode(),
						request.getProperty().getRegion(), score));
	}

	// ⭐ PDF "의뢰 상세" 화면의 "의뢰 승인" 버튼 - 배정받은 시공사 본인만 가능
	@Transactional
	public void approve(Long requestId, Long contractorId) {
		QuoteRequest request = findRequestOrThrow(requestId);
		RequestContractor participation = findParticipation(requestId, contractorId);
		if (!participation.approve()) {
			return;
		}
		request.markQuoteRequested();
		request.touch();
		siteVisitService.createIfAbsent(request, participation.getContractor());

		notificationService.notifyForRequest(request.getOwner().getId(), NotificationType.REQUEST, "의뢰가 승인되었습니다",
				String.format("%s 의뢰를 시공사가 승인했습니다. 채팅에서 방문 일정을 조율해 주세요.", request.getRequestCode()),
				requestId, contractorId);
	}

	// ⭐ PDF "의뢰 상세" 화면의 "의뢰 거절" 버튼 - 배정받은 시공사 본인만 가능
	// ⭐ [Figma 반영] 거절 사유(reason/detail)를 함께 받도록 시그니처를 변경했습니다.
	@Transactional
	public void reject(Long requestId, Long contractorId, RejectReason reason, String detail) {
		QuoteRequest request = findRequestOrThrow(requestId);
		RequestContractor participation = findParticipation(requestId, contractorId);
		participation.reject(reason, detail);
		request.touch();

		notificationService.notify(request.getOwner().getId(), NotificationType.REQUEST, "의뢰가 거절되었습니다",
				String.format("%s 의뢰를 시공사가 거절했습니다.", request.getRequestCode()));
	}

	// ⭐ [Figma 반영] "유효 활동" 발생 지점(채팅 전송, 일정 등록/변경/수락/확인, 현장 방문 완료, 견적 임시저장/전송 등)에서
	// 각 도메인 서비스가 호출해 자동취소 타이머를 리셋하는 공용 확장 지점입니다.
	@Transactional
	public void touchActivity(Long requestId) {
		quoteRequestRepository.findById(requestId).ifPresent(QuoteRequest::touch);
	}

	private RequestContractor findParticipation(Long requestId, Long contractorId) {
		return requestContractorRepository.findByRequestIdAndContractorId(requestId, contractorId)
				.orElseThrow(() -> new ForbiddenAccessException("견적 참여를 요청받은 시공사만 처리할 수 있습니다."));
	}

	private Integer lookupMatchingScore(Long requestId) {
		return analysisJobRepository.findByRequestId(requestId).map(AnalysisJob::getMatchingScore).orElse(null);
	}


	private RequestResponse toResponse(QuoteRequest request, RequestContractorStatus participationStatus,
			Integer matchingScore, boolean includeContractorNames) {
		Long requestId = request.getId();
		Long floorPlanVariantId = request.getFloorPlanVariant() != null
				? request.getFloorPlanVariant().getId()
				: floorPlanVariantRepository
						.findFirstByApartmentRoadAddressAndExclusiveAreaM2AndFloorPlanImageUrlIsNotNull(
								request.getProperty().getRegion(), request.getProperty().getExclusiveAreaM2())
						.map(FloorPlanVariant::getId).orElse(null);
		List<String> contractorNames = includeContractorNames
				? requestContractorRepository.findByRequestId(requestId).stream()
						.map(RequestContractor::getContractor)
						.map(contractor -> contractorProfileRepository.findByMemberId(contractor.getId())
								.map(profile -> profile.getCompanyName())
								.filter(name -> name != null && !name.isBlank())
								.orElse(contractor.getName()))
						.distinct().toList()
				: List.of();
		return new RequestResponse(request, matchingScore, lookupAcceptedQuoteAmount(requestId), participationStatus,
				floorPlanVariantId, contractorNames);
	}

	// ⭐ [고도화] "임대인 예상 공사비 vs 시공사 확정 견적" 비교용 - 수락된 견적이 없으면 null(아직 비교 불가)
	private Long lookupAcceptedQuoteAmount(Long requestId) {
		return contractorQuoteRepository
				.findFirstByRequestIdAndStatusOrderByUpdatedAtDesc(requestId, QuoteStatus.ACCEPTED)
				.map(ContractorQuote::getTotalAmount).orElse(null);
	}

	private QuoteRequest findRequestOrThrow(Long requestId) {
		return quoteRequestRepository.findById(requestId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
	}

	// ⭐ "REQ-260715-000042" 형식: REQ-yyMMdd-{DB가 발급한 실제 id 6자리}. id 기반이라 유일성이 DB
	// 제약조건 수준으로 보장됩니다.
	private String generateRequestCode(Long id) {
		String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
		return String.format("REQ-%s-%06d", datePart, id);
	}
}
