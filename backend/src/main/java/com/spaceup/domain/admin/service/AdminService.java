package com.spaceup.domain.admin.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.admin.dto.AdminDashboardResponse;
import com.spaceup.domain.admin.dto.SystemSettingResponse;
import com.spaceup.domain.admin.entity.SystemSetting;
import com.spaceup.domain.admin.repository.SystemSettingRepository;
import com.spaceup.domain.member.dto.MemberResponse;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberApprovalStatus;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.settlement.entity.SettlementStatus;
import com.spaceup.domain.settlement.repository.SettlementRepository;
import com.spaceup.global.error.InvalidRoleException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.SettingNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

	private final MemberRepository memberRepository;
	private final SystemSettingRepository systemSettingRepository;
	private final QuoteRequestRepository requestRepository;
	private final SettlementRepository settlementRepository;

	// ⭐ PDF "전체 운영 현황" 대시보드 상단 요약 카드
	// ⭐ [최종 검토 반영] findByRoleAndApproved(role, false).size() → countByRoleAndApprovalStatus로 교체
	// (PENDING + NEEDS_REVISION 둘 다 "승인 대기"로 취급합니다)
	public AdminDashboardResponse getDashboard() {
		return new AdminDashboardResponse(memberRepository.countByRole(MemberRole.LANDLORD),
				memberRepository.countByRole(MemberRole.CONTRACTOR),
				memberRepository.countByRole(MemberRole.MATERIAL_VENDOR),
				countPending(MemberRole.CONTRACTOR), countPending(MemberRole.MATERIAL_VENDOR),
				requestRepository.count(), settlementRepository.countByStatus(SettlementStatus.PENDING));
	}

	private long countPending(MemberRole role) {
		return memberRepository.countByRoleAndApprovalStatus(role, MemberApprovalStatus.PENDING)
				+ memberRepository.countByRoleAndApprovalStatus(role, MemberApprovalStatus.NEEDS_REVISION);
	}

	// ⭐ PDF "회원관리" 화면 - role로 필터링해서 전체 목록 조회 (role 미지정 시 전체, 페이지네이션)
	public Page<MemberResponse> getMembers(MemberRole role, Pageable pageable) {
		Page<Member> members = (role != null) ? memberRepository.findByRole(role, pageable)
				: memberRepository.findAll(pageable);
		return members.map(MemberResponse::new);
	}

	// ⭐ PDF "시공사관리 / 자재업체관리" 화면 - 심사 대기(PENDING) + 보완요청(NEEDS_REVISION) 목록
	public List<MemberResponse> getPendingApprovals(MemberRole role) {
		validateApprovableRole(role);
		List<MemberResponse> pending = memberRepository
				.findByRoleAndApprovalStatus(role, MemberApprovalStatus.PENDING).stream().map(MemberResponse::new)
				.collect(Collectors.toList());
		List<MemberResponse> needsRevision = memberRepository
				.findByRoleAndApprovalStatus(role, MemberApprovalStatus.NEEDS_REVISION).stream()
				.map(MemberResponse::new).collect(Collectors.toList());
		pending.addAll(needsRevision);
		return pending;
	}

	// ⭐ PDF "시공사관리 / 자재업체관리" 화면의 "승인" 버튼 - 승인번호(예: AP-260718-004)를 발급합니다.
	@Transactional
	public void approveMember(Long memberId) {
		Member member = findMemberOrThrow(memberId);
		validateApprovableRole(member.getRole());
		member.approve(generateApprovalNumber(member.getId()));
	}

	// ⭐ [Figma 반영] PDF "보완 요청" 화면 - 관리자가 사유/기한을 남기고 회원을 NEEDS_REVISION으로 전환
	@Transactional
	public void requestRevision(Long memberId, String message, LocalDateTime deadline) {
		Member member = findMemberOrThrow(memberId);
		validateApprovableRole(member.getRole());
		member.requestRevision(message, deadline);
	}

	private void validateApprovableRole(MemberRole role) {
		if (role != MemberRole.CONTRACTOR && role != MemberRole.MATERIAL_VENDOR) {
			throw new InvalidRoleException("승인 대상은 시공사 또는 자재업체만 가능합니다.");
		}
	}

	private Member findMemberOrThrow(Long memberId) {
		return memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
	}

	// ⭐ "AP-260718-000004" 형식: AP-yyMMdd-{DB가 발급한 실제 id 6자리}
	private String generateApprovalNumber(Long id) {
		String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
		return String.format("AP-%s-%06d", datePart, id);
	}

	// ⭐ PDF "시스템설정" 화면 - 수수료율 등 조회
	public SystemSettingResponse getSetting(String key) {
		return new SystemSettingResponse(findSettingOrThrow(key));
	}

	// ⭐ PDF "시스템설정" 화면 - 값 변경 (없으면 새로 생성 = upsert)
	@Transactional
	public void updateSetting(String key, String value, String description) {
		systemSettingRepository.findBySettingKey(key).ifPresentOrElse(setting -> setting.updateValue(value),
				() -> systemSettingRepository
						.save(SystemSetting.builder().settingKey(key).settingValue(value).description(description).build()));
	}

	private SystemSetting findSettingOrThrow(String key) {
		return systemSettingRepository.findBySettingKey(key)
				.orElseThrow(() -> new SettingNotFoundException("존재하지 않는 설정입니다: " + key));
	}
}
