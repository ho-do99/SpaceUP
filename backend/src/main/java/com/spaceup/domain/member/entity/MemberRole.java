package com.spaceup.domain.member.entity;

/**
 * ⭐ PDF 로그인 화면의 "로그인 유형" 탭(임대인 / 시공사 / 자재업체) + 별도 관리자 로그인에 대응하는 역할 구분입니다. 이후
 * SecurityConfig에서 역할별 API 접근 제어(hasRole)에 그대로 사용됩니다.
 */
public enum MemberRole {
	LANDLORD, // 임대인
	CONTRACTOR, // 시공사
	MATERIAL_VENDOR, // 자재업체
	ADMIN // 관리자
}
