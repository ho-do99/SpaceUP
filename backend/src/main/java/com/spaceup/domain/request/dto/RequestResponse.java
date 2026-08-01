package com.spaceup.domain.request.dto;

import java.time.LocalDateTime;

import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RejectReason;
import com.spaceup.domain.request.entity.RequestStatus;

import lombok.Getter;

// ⭐ [DB 명칭 정합화] 내부적으로는 QuoteRequest+Property 두 엔티티로 나뉘었지만, 프론트에 노출되는 응답 필드는
// 기존과 동일하게 평탄화해서 내려줍니다(REST 계약 불변).
@Getter
public class RequestResponse {
	private final Long id;
	private final String requestCode;
	private final Long landlordId;
	private final String landlordName;
	private final Long contractorId;
	private final String region;
	private final String propertyType;
	private final Double areaM2;
	private final Long budget;
	private final Long budgetMin;
	private final Long budgetMax;
	private final String desiredDate;
	private final String requestedItems;
	private final RequestStatus status;
	private final RejectReason rejectReason;
	private final String rejectReasonDetail;
	private final LocalDateTime lastActivityAt;
	// ⭐ [Figma 반영] "의뢰 목록" 카드에 매칭 점수가 바로 보여서, 분석 API를 따로 안 타도 되게 여기에도 노출합니다.
	// 값은 RequestService가 AnalysisJobRepository에서 조회해 주입합니다(분석 전이면 null).
	private final Integer matchingScore;
	// ⭐ [고도화] "임대인 예상 공사비(budget) vs 시공사 확정 견적" 비교용 - 수락(ACCEPTED)된 견적이 있으면 그 금액,
	// 아직 없으면 null. matchingScore와 같은 방식으로 RequestService가 조회해 주입합니다.
	private final Long acceptedQuoteAmount;
	private final LocalDateTime createdAt;

	public RequestResponse(QuoteRequest request) {
		this(request, null, null);
	}

	public RequestResponse(QuoteRequest request, Integer matchingScore, Long acceptedQuoteAmount) {
		this.id = request.getId();
		this.requestCode = request.getRequestCode();
		this.landlordId = request.getOwner().getId();
		this.landlordName = request.getOwner().getName();
		this.contractorId = request.getContractor() != null ? request.getContractor().getId() : null;
		this.region = request.getProperty().getRegion();
		this.propertyType = request.getProperty().getHousingType();
		this.areaM2 = request.getProperty().getExclusiveAreaM2();
		this.budget = request.getBudget();
		this.budgetMin = request.getBudgetMin();
		this.budgetMax = request.getBudgetMax();
		this.desiredDate = request.getDesiredDate();
		this.requestedItems = request.getRequestedItems();
		this.status = request.getStatus();
		this.rejectReason = request.getRejectReason();
		this.rejectReasonDetail = request.getRejectReasonDetail();
		this.lastActivityAt = request.getLastActivityAt();
		this.matchingScore = matchingScore;
		this.acceptedQuoteAmount = acceptedQuoteAmount;
		this.createdAt = request.getCreatedAt();
	}
}
