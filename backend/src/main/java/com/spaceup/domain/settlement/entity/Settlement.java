package com.spaceup.domain.settlement.entity;

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

import com.spaceup.domain.member.entity.Member;
import com.spaceup.global.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ PDF "정산/수수료 관리(관리자)", "정산 관리(자재업체)" 화면. partner는 정산 대상(시공사 또는 자재업체).
@Entity
@Table(name = "settlements")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Settlement extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "transaction_code", unique = true, length = 30)
	private String transactionCode; // 예: TR-260714-001

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "partner_id", nullable = false)
	private Member partner; // 정산받는 시공사/자재업체

	@Column(name = "transaction_amount", nullable = false)
	private Long transactionAmount; // 거래 금액

	// ⭐ 관리자 시스템설정의 "기본 수수료율"(예: 10%)을 계산해서 저장. 정책이 거래유형별로 갈리면 이 필드 계산 로직만
	// 서비스단에서 분기하면 됩니다.
	@Column(name = "commission_amount", nullable = false)
	private Long commissionAmount;

	@Column(name = "payout_amount", nullable = false)
	private Long payoutAmount; // 거래금액 - 수수료

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private SettlementStatus status;

	public void complete() {
		this.status = SettlementStatus.SETTLED;
	}

	// ⭐ DB가 부여한 auto-increment id를 이용해 코드를 나중에 붙일 때 사용 (SettlementService 참고)
	public void assignCode(String transactionCode) {
		this.transactionCode = transactionCode;
	}
}
