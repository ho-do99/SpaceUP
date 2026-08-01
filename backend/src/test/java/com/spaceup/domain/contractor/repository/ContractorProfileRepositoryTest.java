package com.spaceup.domain.contractor.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;

import org.hibernate.Hibernate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import com.spaceup.domain.contractor.entity.ContractorProfile;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberApprovalStatus;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.member.repository.MemberRepository;

@DataJpaTest(properties = {
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.datasource.url=jdbc:h2:mem:contractor_profile;MODE=MySQL;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver"
})
class ContractorProfileRepositoryTest {

	@Autowired
	private ContractorProfileRepository contractorProfileRepository;
	@Autowired
	private MemberRepository memberRepository;

	@Test
	void includesFullyEligibleCandidateAndFetchJoinsMember() {
		saveEligibleProfile("eligible");

		List<ContractorProfile> candidates = contractorProfileRepository.findRecommendationCandidates();

		assertThat(candidates).hasSize(1);
		assertThat(Hibernate.isInitialized(candidates.get(0).getMember())).isTrue();
	}

	@Test
	void excludesPendingApproval() {
		saveProfile("pending", MemberApprovalStatus.PENDING, false, true, true, 50_000_000L, 80_000_000L,
				LocalDate.now());

		assertThat(contractorProfileRepository.findRecommendationCandidates()).isEmpty();
	}

	@Test
	void excludesWithdrawnMember() {
		saveProfile("withdrawn", MemberApprovalStatus.APPROVED, true, true, true, 50_000_000L, 80_000_000L,
				LocalDate.now());

		assertThat(contractorProfileRepository.findRecommendationCandidates()).isEmpty();
	}

	@Test
	void excludesNotAvailableForConsult() {
		saveProfile("unavailable", MemberApprovalStatus.APPROVED, false, false, true, 50_000_000L, 80_000_000L,
				LocalDate.now());

		assertThat(contractorProfileRepository.findRecommendationCandidates()).isEmpty();
	}

	@Test
	void excludesPrivateProfile() {
		saveProfile("private", MemberApprovalStatus.APPROVED, false, true, false, 50_000_000L, 80_000_000L,
				LocalDate.now());

		assertThat(contractorProfileRepository.findRecommendationCandidates()).isEmpty();
	}

	@Test
	void excludesMissingEstimateRange() {
		saveProfile("noEstimate", MemberApprovalStatus.APPROVED, false, true, true, null, null, LocalDate.now());

		assertThat(contractorProfileRepository.findRecommendationCandidates()).isEmpty();
	}

	@Test
	void excludesMissingAvailableFromDate() {
		saveProfile("noDate", MemberApprovalStatus.APPROVED, false, true, true, 50_000_000L, 80_000_000L, null);

		assertThat(contractorProfileRepository.findRecommendationCandidates()).isEmpty();
	}

	private void saveEligibleProfile(String username) {
		saveProfile(username, MemberApprovalStatus.APPROVED, false, true, true, 50_000_000L, 80_000_000L,
				LocalDate.now());
	}

	private void saveProfile(String username, MemberApprovalStatus approvalStatus, boolean withdrawn,
			boolean availableForConsult, boolean profilePublic, Long estimateMin, Long estimateMax,
			LocalDate availableFromDate) {
		Member member = Member.builder().username(username).password("encoded").email(username + "@test.com")
				.name("테스트시공사").role(MemberRole.CONTRACTOR).approvalStatus(approvalStatus).withdrawn(withdrawn)
				.build();
		memberRepository.save(member);

		ContractorProfile profile = ContractorProfile.builder().member(member).availableForConsult(availableForConsult)
				.profilePublic(profilePublic).estimateMin(estimateMin).estimateMax(estimateMax)
				.availableFromDate(availableFromDate).build();
		contractorProfileRepository.save(profile);
	}
}
