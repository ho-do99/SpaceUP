package com.spaceup.domain.contractor.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.contractor.entity.ContractorProfile;

import jakarta.persistence.LockModeType;

@Repository
public interface ContractorProfileRepository extends JpaRepository<ContractorProfile, Long> {

	Optional<ContractorProfile> findByMemberId(Long memberId);

	// ⭐ [동시성 수정] 리뷰가 동시에 여러 개 등록될 때 평균/개수를 다시 계산해 반영하는 지점에서, 두 트랜잭션이
	// 각자 다른 리뷰만 보고 평균을 계산해 마지막에 커밋한 쪽이 먼저 쓴 값을 덮어써 버리는 lost update를
	// 막기 위한 행 단위 락 조회입니다. 이 조회로 잠근 트랜잭션이 끝날 때까지 다른 트랜잭션은 대기합니다.
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select cp from ContractorProfile cp where cp.member.id = :memberId")
	Optional<ContractorProfile> findByMemberIdForUpdate(@Param("memberId") Long memberId);

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
