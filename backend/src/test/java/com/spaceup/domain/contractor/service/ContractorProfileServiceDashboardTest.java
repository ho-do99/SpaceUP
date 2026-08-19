package com.spaceup.domain.contractor.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.contractor.dto.ContractorDashboardResponse;
import com.spaceup.domain.contractor.repository.ContractorProfileRepository;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.quote.entity.QuoteStatus;
import com.spaceup.domain.quote.repository.ContractorQuoteRepository;
import com.spaceup.domain.request.entity.RequestContractorStatus;
import com.spaceup.domain.request.repository.RequestContractorRepository;
import com.spaceup.domain.settlement.entity.SettlementStatus;
import com.spaceup.domain.settlement.repository.SettlementRepository;

@ExtendWith(MockitoExtension.class)
class ContractorProfileServiceDashboardTest {

	@Mock ContractorProfileRepository contractorProfileRepository;
	@Mock MemberRepository memberRepository;
	@Mock RequestContractorRepository requestContractorRepository;
	@Mock ContractorQuoteRepository contractorQuoteRepository;
	@Mock SettlementRepository settlementRepository;
	@InjectMocks ContractorProfileService service;

	@Test
	void dashboardCountsInvitedAndApprovedParticipationsForMultiContractorRequests() {
		long contractorId = 7L;
		when(requestContractorRepository.countByContractorIdAndStatus(contractorId, RequestContractorStatus.INVITED)).thenReturn(2L);
		when(requestContractorRepository.countByContractorIdAndStatus(contractorId, RequestContractorStatus.APPROVED)).thenReturn(1L);
		when(contractorQuoteRepository.countByContractorIdAndStatus(contractorId, QuoteStatus.SUBMITTED)).thenReturn(3L);
		when(contractorQuoteRepository.countByContractorIdAndStatus(contractorId, QuoteStatus.ACCEPTED)).thenReturn(4L);
		when(settlementRepository.sumPayoutAmountByPartnerIdAndStatus(contractorId, SettlementStatus.PENDING)).thenReturn(5_000L);

		ContractorDashboardResponse result = service.getDashboard(contractorId);

		assertThat(result.getNewLeadsCount()).isEqualTo(2L);
		assertThat(result.getQuoteRequestedCount()).isEqualTo(1L);
		assertThat(result.getQuoteSentCount()).isEqualTo(3L);
		assertThat(result.getContractPendingCount()).isEqualTo(4L);
		assertThat(result.getPendingSettlementAmount()).isEqualTo(5_000L);
		verify(requestContractorRepository).countByContractorIdAndStatus(contractorId, RequestContractorStatus.INVITED);
		verify(requestContractorRepository).countByContractorIdAndStatus(contractorId, RequestContractorStatus.APPROVED);
	}
}
