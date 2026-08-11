package com.spaceup.domain.member.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberApprovalStatus;
import com.spaceup.domain.member.entity.MemberRole;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

	// ⭐ 로그인 식별자: 별도 아이디 없이 email로 로그인합니다.
	Optional<Member> findByEmail(String email);

	// ⭐ PDF "회원관리(관리자)" - 역할별 전체 목록 (페이지네이션)
	Page<Member> findByRole(MemberRole role, Pageable pageable);

	// ⭐ [최종 검토 반영] 기존 findByRoleAndApproved(boolean)를 승인 워크플로우(enum) 기준으로 교체했습니다.
	// 시공사 관리(관리자) - 심사 대기(PENDING) 또는 보완요청(NEEDS_REVISION) 큐.
	List<Member> findByRoleAndApprovalStatus(MemberRole role, MemberApprovalStatus approvalStatus);

	long countByRole(MemberRole role);

	// ⭐ 대시보드용: 역할 + 승인상태 조합 카운트 (예: 승인 대기 중인 시공사 수)
	long countByRoleAndApprovalStatus(MemberRole role, MemberApprovalStatus approvalStatus);
}
