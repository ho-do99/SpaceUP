package com.spaceup.domain.settlement.dto;

import com.spaceup.domain.settlement.entity.Settlement;
import com.spaceup.domain.settlement.entity.SettlementStatus;

import lombok.Getter;

@Getter
public class SettlementResponse {
	private final Long id;
	private final String transactionCode;
	private final Long partnerId;
	private final String partnerName;
	private final Long transactionAmount;
	private final Long commissionAmount;
	private final Long payoutAmount;
	private final SettlementStatus status;

	public SettlementResponse(Settlement settlement) {
		this.id = settlement.getId();
		this.transactionCode = settlement.getTransactionCode();
		this.partnerId = settlement.getPartner().getId();
		this.partnerName = settlement.getPartner().getName();
		this.transactionAmount = settlement.getTransactionAmount();
		this.commissionAmount = settlement.getCommissionAmount();
		this.payoutAmount = settlement.getPayoutAmount();
		this.status = settlement.getStatus();
	}
}
