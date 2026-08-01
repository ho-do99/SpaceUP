package com.spaceup.domain.settlement.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.admin.repository.SystemSettingRepository;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.entity.NotificationType;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.settlement.dto.SettlementCreateRequest;
import com.spaceup.domain.settlement.dto.SettlementResponse;
import com.spaceup.domain.settlement.entity.Settlement;
import com.spaceup.domain.settlement.entity.SettlementStatus;
import com.spaceup.domain.settlement.repository.SettlementRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.SettlementNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementService {

	private final SettlementRepository settlementRepository;
	private final MemberRepository memberRepository;
	private final SystemSettingRepository systemSettingRepository;
	private final NotificationService notificationService;

	// ⭐ admin/system_settings 테이블의 "COMMISSION_RATE" 키가 없을 때만 쓰는 안전장치용 기본값입니다.
	// (관리자가 시스템설정 화면에서 값을 세팅하면 그쪽이 우선합니다)
	private static final String COMMISSION_RATE_KEY = "COMMISSION_RATE";
	private static final double FALLBACK_COMMISSION_RATE = 0.10;

	// ⭐ PDF "정산/수수료 관리(관리자)" - 거래 1건에 대한 정산 레코드 생성. 거래금액에서 수수료를 뗀 정산액을 계산합니다.
	// ⭐ [Figma 반영] 생성 시점에 정산 대상자(시공사/자재업체)에게 알림을 보냅니다.
	@Transactional
	public Long createSettlement(SettlementCreateRequest dto) {
		Member partner = memberRepository.findById(dto.getPartnerId())
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + dto.getPartnerId()));

		long commission = Math.round(dto.getTransactionAmount() * getCommissionRate());
		long payout = dto.getTransactionAmount() - commission;

		Settlement settlement = Settlement.builder().partner(partner).transactionAmount(dto.getTransactionAmount())
				.commissionAmount(commission).payoutAmount(payout).status(SettlementStatus.PENDING).build();

		settlementRepository.save(settlement);
		// ⭐ count()+1 대신 DB가 발급한 id를 그대로 코드에 사용 (동시 생성에도 안전)
		settlement.assignCode(generateTransactionCode(settlement.getId()));

		notificationService.notify(partner.getId(), NotificationType.SETTLEMENT, "정산 예정 내역이 등록되었습니다",
				String.format("%,d원 정산이 예정되어 있습니다.", payout));
		return settlement.getId();
	}

	// ⭐ admin/system_settings에 COMMISSION_RATE가 등록돼 있으면 그 값을, 없으면 기본 10%를 사용합니다.
	private double getCommissionRate() {
		return systemSettingRepository.findBySettingKey(COMMISSION_RATE_KEY)
				.map(setting -> Double.parseDouble(setting.getSettingValue())).orElse(FALLBACK_COMMISSION_RATE);
	}

	// ⭐ PDF "정산 관리(자재업체/시공사)" - 정산 완료 처리
	// ⭐ [Figma 반영] 완료 시점에 정산 대상자에게 알림을 보냅니다.
	@Transactional
	public void complete(Long settlementId) {
		Settlement settlement = findSettlementOrThrow(settlementId);
		settlement.complete();
		notificationService.notify(settlement.getPartner().getId(), NotificationType.SETTLEMENT, "정산 처리가 완료되었습니다",
				String.format("%s 정산 금액이 지급되었습니다.", settlement.getTransactionCode()));
	}

	// ⭐ 정산 당사자 본인 또는 관리자만 상세 조회 가능
	public SettlementResponse getSettlement(Long settlementId, Long requesterId) {
		Settlement settlement = findSettlementOrThrow(settlementId);
		Member requester = memberRepository.findById(requesterId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + requesterId));

		boolean isOwner = settlement.getPartner().getId().equals(requesterId);
		boolean isAdmin = requester.getRole() == MemberRole.ADMIN;
		if (!isOwner && !isAdmin) {
			throw new ForbiddenAccessException("본인의 정산 내역만 조회할 수 있습니다.");
		}
		return new SettlementResponse(settlement);
	}

	// ⭐ 정산 대상(시공사/자재업체) 로그인 기준 - 본인 정산 내역 조회 (페이지네이션)
	public Page<SettlementResponse> getSettlementsByPartner(Long partnerId, Pageable pageable) {
		return settlementRepository.findByPartnerId(partnerId, pageable).map(SettlementResponse::new);
	}

	private Settlement findSettlementOrThrow(Long settlementId) {
		return settlementRepository.findById(settlementId)
				.orElseThrow(() -> new SettlementNotFoundException("존재하지 않는 정산 내역입니다: " + settlementId));
	}

	private String generateTransactionCode(Long id) {
		String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
		return String.format("TR-%s-%06d", datePart, id);
	}
}
