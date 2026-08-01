package com.spaceup.domain.member.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ [DB 명칭 정합화] DB팀 명세(컬럼, 인스턴스 이름 변경.pdf)의 user_account에 테이블/컬럼명을 맞췄습니다.
// 자바 클래스명/필드명/getter는 그대로 둡니다 - 코드 전체에서 Member.getId() 등을 이미 광범위하게 쓰고 있어서,
// DB 컬럼명과 자바 필드명이 다른 건 JPA에서 전혀 문제가 안 됩니다(@Column(name=...)으로만 매핑하면 됨).
@Entity
@Table(name = "user_account")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 무분별한 객체 생성을 막는 현업 표준 보안 스타일
@AllArgsConstructor
@Builder
public class Member {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY) // 기본키(PK) 자동 증가 설정 (MySQL Auto_Increment)
	@Column(name = "user_id")
	private Long id;

	// ⭐ PDF의 user_account엔 별도 로그인 아이디 컬럼이 없지만(email/user_name만 있음), 지금 로그인 플로우가
	// username 기반이라 그룹 B 전용 컬럼으로 그대로 유지합니다.
	@Column(nullable = false, unique = true, length = 50) // 아이디는 필수, 중복 불가
	private String username;

	@Column(name = "password_hash", nullable = false, length = 100) // 암호화된 비밀번호가 들어가므로 길이를 여유 있게 설정
	private String password;

	@Column(nullable = false, length = 100)
	private String email;

	@Column(name = "user_name", nullable = false, length = 30)
	private String name;

	// ⭐ [Figma 반영] "회원가입 - 휴대폰 인증" 단계용 필드. 실제 SMS 발송/검증 연동은 아직 없고(외부 SMS
	// 벤더 선정이 필요한 별도 작업), 여기서는 번호 저장 + 수동 인증완료 플래그만 제공합니다.
	@Column(name = "phone", length = 20)
	private String phoneNumber;

	@Builder.Default
	@Column(name = "phone_verified", nullable = false)
	private boolean phoneVerified = false;

	// ⭐ [목업 OTP] 휴대폰 인증코드 발급/확인용. 실제 클라우드 SMS 벤더 연동 전까지 쓰는 목업 필드입니다.
	@Column(name = "phone_verification_code", length = 10)
	private String phoneVerificationCode;

	@Column(name = "phone_verification_expires_at")
	private LocalDateTime phoneVerificationExpiresAt;

	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt; // 가입 일시

	// ⭐ [DB 명칭 정합화] PDF의 user_account.updated_at에 대응. Member는 다른 엔티티들과 달리
	// BaseTimeEntity를 상속하지 않아서 직접 @PreUpdate로 관리합니다.
	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	@Enumerated(EnumType.STRING)
	@Column(name = "user_role", nullable = false, length = 20)
	private MemberRole role; // ⭐ 로그인 유형(임대인/시공사/자재업체/관리자) - PDF 로그인 화면의 역할 탭에 대응

	// ⭐ [Figma 반영] 기존 boolean approved를 심사 워크플로우(대기/보완요청/승인)로 승격했습니다.
	// LANDLORD/ADMIN은 가입 즉시 APPROVED, CONTRACTOR/MATERIAL_VENDOR는 PENDING으로 시작합니다.
	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(name = "approval_status", nullable = false, length = 20)
	private MemberApprovalStatus approvalStatus = MemberApprovalStatus.APPROVED;

	// ⭐ 심사 신청번호 (예: ON-260715-018) - 가입 시 발급
	@Column(name = "application_number", length = 30)
	private String applicationNumber;

	// ⭐ 승인번호 (예: AP-260718-004) - 관리자가 승인하는 시점에 발급
	@Column(name = "approval_number", length = 30)
	private String approvalNumber;

	// ⭐ 보완 요청 사유 (관리자가 NEEDS_REVISION 처리 시 입력)
	@Column(name = "revision_message", length = 500)
	private String revisionMessage;

	// ⭐ 보완 자료 재제출 기한
	@Column(name = "revision_deadline")
	private LocalDateTime revisionDeadline;

	@Builder.Default
	@Column(nullable = false)
	private boolean withdrawn = false; // 탈퇴 여부 (소프트 삭제 플래그)

	// ⭐ [DB 명칭 정합화] PDF user_account.deleted_at과 의미가 같아 컬럼명만 맞췄습니다(자바 필드명은 유지).
	@Column(name = "deleted_at")
	private LocalDateTime withdrawnAt; // 탈퇴 처리 일시

	// 데이터가 처음 DB에 저장될 때 가입 시간을 시스템 기준으로 자동으로 주입하는 메서드
	@PrePersist
	protected void onCreate() {
		this.createdAt = LocalDateTime.now();
		this.updatedAt = LocalDateTime.now();
	}

	@PreUpdate
	protected void onUpdate() {
		this.updatedAt = LocalDateTime.now();
	}

	public void updateProfile(String email, String name) {
		this.email = email;
		this.name = name;
	}

	// ⭐ [Figma 반영] 마이페이지 - 계정설정에서 휴대폰 번호를 바꾸면 재인증이 필요하므로 verified를 초기화합니다.
	public void updatePhoneNumber(String phoneNumber) {
		this.phoneNumber = phoneNumber;
		this.phoneVerified = false;
		this.phoneVerificationCode = null;
		this.phoneVerificationExpiresAt = null;
	}

	// ⭐ [목업 OTP] 인증코드를 발급해서 저장합니다. 실제 SMS 발송은 MemberService에서 처리(지금은 목업).
	public void issueVerificationCode(String code, LocalDateTime expiresAt) {
		this.phoneVerificationCode = code;
		this.phoneVerificationExpiresAt = expiresAt;
	}

	// ⭐ [목업 OTP] 저장된 코드/만료시각과 대조해 일치하면 인증 완료 처리하고 코드를 비웁니다(재사용 방지).
	public boolean verifyCode(String code) {
		if (phoneVerificationCode == null || phoneVerificationExpiresAt == null) {
			return false;
		}
		if (phoneVerificationExpiresAt.isBefore(LocalDateTime.now())) {
			return false;
		}
		if (!phoneVerificationCode.equals(code)) {
			return false;
		}
		this.phoneVerified = true;
		this.phoneVerificationCode = null;
		this.phoneVerificationExpiresAt = null;
		return true;
	}

	// ⭐ 실제 SMS OTP 검증 로직이 붙기 전까지 쓰는 수동 인증완료 처리(관리자/테스트용으로 남겨둠).
	public void verifyPhone() {
		this.phoneVerified = true;
	}

	public void assignApplicationNumber(String applicationNumber) {
		this.applicationNumber = applicationNumber;
	}

	// ⭐ 관리자 승인 처리(시공사/자재업체 전용). 승인번호를 발급하고 보완요청 관련 필드는 비웁니다.
	public void approve(String approvalNumber) {
		this.approvalStatus = MemberApprovalStatus.APPROVED;
		this.approvalNumber = approvalNumber;
		this.revisionMessage = null;
		this.revisionDeadline = null;
	}

	// ⭐ [Figma 반영] "보완 요청" 처리 - 심사 담당자가 사유와 재제출 기한을 남깁니다.
	public void requestRevision(String message, LocalDateTime deadline) {
		this.approvalStatus = MemberApprovalStatus.NEEDS_REVISION;
		this.revisionMessage = message;
		this.revisionDeadline = deadline;
	}

	// ⭐ [Figma 반영] 보완 요청을 받은 회원이 자료를 다시 제출하면 심사 대기 상태로 되돌립니다.
	public void resubmit() {
		this.approvalStatus = MemberApprovalStatus.PENDING;
	}

	/**
	 * 소프트 삭제: 계정을 비활성화하고 개인정보를 익명화합니다. username은 유니크 제약 때문에 그대로 두어 재사용을 막고(예약 처리),
	 * 작성한 글/댓글은 이 회원의 name이 바뀌므로 자동으로 "탈퇴한 회원"으로 표시됩니다.
	 */
	public void withdraw() {
		this.name = "탈퇴한 회원";
		this.email = "withdrawn@deleted.local";
		this.withdrawn = true;
		this.withdrawnAt = LocalDateTime.now();
	}
}
