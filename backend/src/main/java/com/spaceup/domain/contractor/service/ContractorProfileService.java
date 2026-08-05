package com.spaceup.domain.contractor.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.contractor.dto.ContractorDashboardResponse;
import com.spaceup.domain.contractor.dto.ContractorProfileResponse;
import com.spaceup.domain.contractor.dto.ContractorProfileUpdateRequest;
import com.spaceup.domain.contractor.dto.ContractorServiceInfoUpdateRequest;
import com.spaceup.domain.contractor.dto.DisclosureSettingsUpdateRequest;
import com.spaceup.domain.contractor.dto.ManagerInfoUpdateRequest;
import com.spaceup.domain.contractor.entity.ContractorProfile;
import com.spaceup.domain.contractor.repository.ContractorProfileRepository;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.quote.entity.QuoteStatus;
import com.spaceup.domain.quote.repository.ContractorQuoteRepository;
import com.spaceup.domain.request.entity.RequestStatus;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.settlement.entity.SettlementStatus;
import com.spaceup.domain.settlement.repository.SettlementRepository;
import com.spaceup.global.error.InvalidRoleException;
import com.spaceup.global.error.MemberNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContractorProfileService {

	private final ContractorProfileRepository contractorProfileRepository;
	private final MemberRepository memberRepository;
	private final QuoteRequestRepository quoteRequestRepository;
	private final ContractorQuoteRepository contractorQuoteRepository;
	private final SettlementRepository settlementRepository;

	// ⭐ get-or-create 패턴: 시공사가 프로필을 아직 한 번도 저장 안 했어도 조회 시 빈 프로필을 즉시 만들어 돌려줍니다.
	// (1:1 부가정보라 "없으면 404"보다 "없으면 빈 값"이 프론트에서 다루기 더 쉬움)
	@Transactional
	public ContractorProfileResponse getOrCreate(Long memberId) {
		return new ContractorProfileResponse(findOrCreateProfile(memberId));
	}

	@Transactional
	public void updateProfile(Long memberId, ContractorProfileUpdateRequest dto) {
		ContractorProfile profile = findOrCreateProfile(memberId);
		profile.updateProfile(dto.getBusinessRegistrationNumber(), dto.getCompanyName(), dto.getActivityRegions(),
				dto.getSpecialties(), dto.getPortfolioUrl(), dto.getIntroduction());
	}

	// ⭐ [Figma 반영] "담당자 정보 저장" 버튼
	@Transactional
	public void updateManagerInfo(Long memberId, ManagerInfoUpdateRequest dto) {
		ContractorProfile profile = findOrCreateProfile(memberId);
		profile.updateManagerInfo(dto.getManagerPosition(), dto.getConsultationHours());
	}

	// ⭐ [Figma 반영] "공개 설정 저장" 버튼
	@Transactional
	public void updateDisclosureSettings(Long memberId, DisclosureSettingsUpdateRequest dto) {
		ContractorProfile profile = findOrCreateProfile(memberId);
		profile.updateDisclosureSettings(dto.isProfilePublic(), dto.isContactPublic(), dto.isSpecialtyPublic(),
				dto.isRegionPublic(), dto.isPortfolioPublic(), dto.isAvailableForConsult());
	}

	// ⭐ [시공사 추천 점수] "예상 견적 적합도"/"일정 적합도" 계산에 쓰이는 견적 범위·가능일 저장
	@Transactional
	public void updateServiceInfo(Long memberId, ContractorServiceInfoUpdateRequest dto) {
		ContractorProfile profile = findOrCreateProfile(memberId);
		profile.updateServiceInfo(dto.getEstimateMin(), dto.getEstimateMax(), dto.getAvailableFromDate());
	}

	// ⭐ [Figma 반영] "시공사 대시보드" 상단 요약 카드. 정확한 단계 매핑은 API 명세서 비고 참고.
	public ContractorDashboardResponse getDashboard(Long memberId) {
		long newLeads = quoteRequestRepository.countByContractorIdAndStatus(memberId, RequestStatus.REVIEWING);
		long quoteRequested = quoteRequestRepository.countByContractorIdAndStatus(memberId,
				RequestStatus.QUOTE_REQUESTED);
		long quoteSent = contractorQuoteRepository.countByContractorIdAndStatus(memberId, QuoteStatus.SUBMITTED);
		long contractPending = contractorQuoteRepository.countByContractorIdAndStatus(memberId, QuoteStatus.ACCEPTED);
		Long pendingAmount = settlementRepository.sumPayoutAmountByPartnerIdAndStatus(memberId,
				SettlementStatus.PENDING);
		return new ContractorDashboardResponse(newLeads, quoteRequested, quoteSent, contractPending,
				pendingAmount != null ? pendingAmount : 0L);
	}

	// ⭐ [프론트 연동] "시공사 상세" 화면 - 임대인이 다른 시공사의 프로필을 조회할 때 사용.
	// /me와 달리 프로필이 없으면 빈 값을 만들어주지 않고 404를 던집니다(아직 정보를 등록하지 않은 시공사이므로).
	public ContractorProfileResponse getPublicProfile(Long contractorId) {
		return new ContractorProfileResponse(contractorProfileRepository.findByMemberId(contractorId)
				.orElseThrow(() -> new MemberNotFoundException("아직 프로필을 등록하지 않은 시공사입니다: " + contractorId)));
	}

	// ⭐ 시공 완료 시 domain/schedule 쪽에서 호출해 실적을 누적하는 확장 지점
	@Transactional
	public void increaseCompletedProject(Long memberId) {
		findOrCreateProfile(memberId).increaseCompletedProject();
	}

	// ⭐ domain/review 쪽에서 리뷰가 생성/변경될 때마다 평균 평점+개수를 다시 계산해 호출하는 확장 지점
	@Transactional
	public void updateRating(Long memberId, double averageRating, int reviewCount) {
		findOrCreateProfile(memberId).updateRating(averageRating, reviewCount);
	}

	private ContractorProfile findOrCreateProfile(Long memberId) {
		return contractorProfileRepository.findByMemberId(memberId).orElseGet(() -> createEmptyProfile(memberId));
	}

	private ContractorProfile createEmptyProfile(Long memberId) {
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));

		if (member.getRole() != MemberRole.CONTRACTOR) {
			throw new InvalidRoleException("시공사(CONTRACTOR) 회원만 프로필을 가질 수 있습니다.");
		}

		ContractorProfile profile = ContractorProfile.builder().member(member).build();
		return contractorProfileRepository.save(profile);
	}
}
