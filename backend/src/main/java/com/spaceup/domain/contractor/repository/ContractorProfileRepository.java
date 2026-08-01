package com.spaceup.domain.contractor.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.contractor.entity.ContractorProfile;

@Repository
public interface ContractorProfileRepository extends JpaRepository<ContractorProfile, Long> {

	Optional<ContractorProfile> findByMemberId(Long memberId);

	// ⭐ [시공사 추천 점수 고도화] 추천 후보 조회 - 승인/탈퇴/공개/상담가능/견적범위/가능일 조건을 모두 DB에서 걸러내고,
	// member를 fetch join으로 함께 가져와서(추천 후보 N명마다 이름/ID 조회로 개별 쿼리가 나가는 N+1을 없앱니다.
	@Query("""
			SELECT cp FROM ContractorProfile cp
			JOIN FETCH cp.member m
			WHERE m.role = com.spaceup.domain.member.entity.MemberRole.CONTRACTOR
			  AND m.approvalStatus = com.spaceup.domain.member.entity.MemberApprovalStatus.APPROVED
			  AND m.withdrawn = false
			  AND cp.availableForConsult = true
			  AND cp.profilePublic = true
			  AND cp.estimateMin IS NOT NULL
			  AND cp.estimateMax IS NOT NULL
			  AND cp.estimateMin >= 0
			  AND cp.estimateMax >= cp.estimateMin
			  AND cp.availableFromDate IS NOT NULL
			""")
	List<ContractorProfile> findRecommendationCandidates();
}
