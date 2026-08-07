package com.spaceup.domain.request.entity;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.global.entity.BaseTimeEntity;
import com.spaceup.global.error.InvalidStatusTransitionException;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "request_contractors", uniqueConstraints = @UniqueConstraint(
		name = "uk_request_contractors_request_contractor", columnNames = { "request_id", "contractor_id" }))
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class RequestContractor extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "request_id", nullable = false)
	private QuoteRequest request;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "contractor_id", nullable = false)
	private Member contractor;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private RequestContractorStatus status;

	@Enumerated(EnumType.STRING)
	@Column(name = "reject_reason", length = 30)
	private RejectReason rejectReason;

	@Column(name = "reject_reason_detail", length = 300)
	private String rejectReasonDetail;

	@Column(name = "matching_score")
	private Integer matchingScore;

	public void approve() {
		validateStatus(RequestContractorStatus.INVITED);
		this.status = RequestContractorStatus.APPROVED;
	}

	public void reject(RejectReason reason, String detail) {
		validateStatus(RequestContractorStatus.INVITED);
		this.status = RequestContractorStatus.REJECTED;
		this.rejectReason = reason;
		this.rejectReasonDetail = detail;
	}

	public void select() {
		if (status != RequestContractorStatus.INVITED && status != RequestContractorStatus.APPROVED) {
			throw new InvalidStatusTransitionException("견적 참여 중인 시공사만 최종 선택할 수 있습니다.");
		}
		this.status = RequestContractorStatus.SELECTED;
	}

	public void close() {
		if (status == RequestContractorStatus.INVITED || status == RequestContractorStatus.APPROVED) {
			this.status = RequestContractorStatus.CLOSED;
		}
	}

	public boolean canContact() {
		return status == RequestContractorStatus.INVITED || status == RequestContractorStatus.APPROVED
				|| status == RequestContractorStatus.SELECTED;
	}

	public void updateMatchingScore(int matchingScore) {
		this.matchingScore = matchingScore;
	}

	private void validateStatus(RequestContractorStatus expected) {
		if (status != expected) {
			throw new InvalidStatusTransitionException(
					String.format("현재 참여 상태(%s)에서는 처리할 수 없습니다. 예상 상태: %s", status, expected));
		}
	}
}
