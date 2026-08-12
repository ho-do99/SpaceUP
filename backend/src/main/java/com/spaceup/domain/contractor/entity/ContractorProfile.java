package com.spaceup.domain.contractor.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.global.entity.BaseTimeEntity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * ⭐ Member(role=CONTRACTOR)에 딸린 1:1 부가 정보입니다. Member를 role 공용 엔티티로 가볍게 유지하고,
 * 시공사만 갖는 속성(사업자번호/활동지역/전문분야/포트폴리오/평점)은 여기로 분리했습니다. 가입 직후엔 없을 수 있고
 * (member/service 쪽에서 role=CONTRACTOR로 가입해도 자동 생성하지 않음), 온보딩 단계에서 최초 등록/수정 API로
 * 채워 넣는 구조입니다.
 */
@Entity
@Table(name = "contractor_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ContractorProfile extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "member_id", nullable = false, unique = true)
	private Member member;

	@Column(name = "business_reg_no", length = 20)
	private String businessRegistrationNumber; // 사업자등록번호

	// ⭐ [Figma 반영] 시공사 회원가입 화면 필드
	@Column(name = "representative_name", length = 30)
	private String representativeName; // 대표자명

	@Column(name = "business_registration_certificate_url", length = 300)
	private String businessRegistrationCertificateUrl; // 사업자등록증 파일 URL (가입 전 업로드 API로 미리 받은 값)

	@Column(name = "company_name", length = 50)
	private String companyName;

	@Column(name = "company_address", length = 200)
	private String companyAddress; // 업체 주소

	@Column(name = "business_address", length = 200)
	private String businessAddress; // 사업장 주소

	@Column(name = "construction_experience_months")
	private Integer constructionExperienceMonths; // 시공 경력(개월)

	@Column(name = "activity_regions", length = 200)
	private String activityRegions; // 활동 지역 (콤마 구분, 예: "광주 북구,광주 서구")

	@Column(name = "travel_distance_km")
	private Integer travelDistanceKm; // 출장 가능 거리(km), 예: 10/30/50

	@Column(name = "specialties", length = 200)
	private String specialties; // 전문 분야 (콤마 구분, 예: "도배,바닥재,조명")

	@Column(name = "portfolio_url", length = 300)
	private String portfolioUrl;

	@Column(name = "introduction", length = 500)
	private String introduction;

	@Builder.Default
	@Column(name = "rating")
	private Double rating = 0.0; // 평균 평점

	// ⭐ [시공사 추천 점수] 리뷰 개수 - 아직 리뷰 도메인이 없어서 rating과 마찬가지로 외부에서 갱신해 주는 값입니다.
	@Builder.Default
	@Column(name = "review_count")
	private Integer reviewCount = 0;

	@Builder.Default
	@Column(name = "completed_project_count")
	private Integer completedProjectCount = 0;

	// ⭐ [시공사 추천 점수] "예상 견적 적합도" 계산용 - 이 업체가 통상 제시하는 견적 범위
	@Column(name = "estimate_min")
	private Long estimateMin;

	@Column(name = "estimate_max")
	private Long estimateMax;

	// ⭐ [시공사 추천 점수] "일정 적합도" 계산용 - 가장 빠른 시공 가능일
	@Column(name = "available_from_date")
	private LocalDate availableFromDate;

	// ===== ⭐ [Figma 반영] "담당자 정보" 화면 =====
	@Column(name = "manager_position", length = 30)
	private String managerPosition; // 직책 (예: "영업 담당자")

	@Column(name = "consultation_hours", length = 50)
	private String consultationHours; // 상담 가능 시간 (예: "평일 09:00-18:00")

	// ===== ⭐ [Figma 반영] "업체 공개 설정" 화면 - 6개 토글. 전부 기본값 true(공개)로 시작합니다. =====
	@Builder.Default
	@Column(name = "profile_public", nullable = false)
	private boolean profilePublic = true; // 업체 프로필 공개(업체명/대표 정보)

	@Builder.Default
	@Column(name = "contact_public", nullable = false)
	private boolean contactPublic = true; // 담당자 연락처 공개

	@Builder.Default
	@Column(name = "specialty_public", nullable = false)
	private boolean specialtyPublic = true; // 전문 분야 공개

	@Builder.Default
	@Column(name = "region_public", nullable = false)
	private boolean regionPublic = true; // 시공 가능 지역 공개

	@Builder.Default
	@Column(name = "portfolio_public", nullable = false)
	private boolean portfolioPublic = true; // 포트폴리오 공개

	@Builder.Default
	@Column(name = "available_for_consult", nullable = false)
	private boolean availableForConsult = true; // 신규 상담 가능 상태

	public void updateProfile(String businessRegistrationNumber, String representativeName,
			String businessRegistrationCertificateUrl, String companyName, String companyAddress,
			String businessAddress, Integer constructionExperienceMonths, String activityRegions,
			Integer travelDistanceKm, String specialties, String portfolioUrl, String introduction) {
		this.businessRegistrationNumber = businessRegistrationNumber;
		this.representativeName = representativeName;
		this.businessRegistrationCertificateUrl = businessRegistrationCertificateUrl;
		this.companyName = companyName;
		this.companyAddress = companyAddress;
		this.businessAddress = businessAddress;
		this.constructionExperienceMonths = constructionExperienceMonths;
		this.activityRegions = activityRegions;
		this.travelDistanceKm = travelDistanceKm;
		this.specialties = specialties;
		this.portfolioUrl = portfolioUrl;
		this.introduction = introduction;
	}

	// ⭐ [Figma 반영] "담당자 정보 저장" 버튼
	public void updateManagerInfo(String managerPosition, String consultationHours) {
		this.managerPosition = managerPosition;
		this.consultationHours = consultationHours;
	}

	// ⭐ [Figma 반영] "공개 설정 저장" 버튼 - 6개 토글 일괄 저장
	public void updateDisclosureSettings(boolean profilePublic, boolean contactPublic, boolean specialtyPublic,
			boolean regionPublic, boolean portfolioPublic, boolean availableForConsult) {
		this.profilePublic = profilePublic;
		this.contactPublic = contactPublic;
		this.specialtyPublic = specialtyPublic;
		this.regionPublic = regionPublic;
		this.portfolioPublic = portfolioPublic;
		this.availableForConsult = availableForConsult;
	}

	// 임대인이 프로젝트 완료를 최종 확인한 시점에 시공 실적을 누적합니다.
	public void increaseCompletedProject() {
		this.completedProjectCount++;
	}

	// ⭐ 리뷰/평점 도메인이 생기면 그쪽에서 평균+개수를 계산해 이 메서드로 반영
	public void updateRating(double newRating, int reviewCount) {
		this.rating = newRating;
		this.reviewCount = reviewCount;
	}

	// ⭐ [시공사 추천 점수] "견적 범위 / 가능 일정" 저장 - 시공사가 직접 입력(마이페이지)
	public void updateServiceInfo(Long estimateMin, Long estimateMax, LocalDate availableFromDate) {
		this.estimateMin = estimateMin;
		this.estimateMax = estimateMax;
		this.availableFromDate = availableFromDate;
	}
}
