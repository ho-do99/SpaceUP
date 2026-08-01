package com.spaceup.domain.member.dto;

// ⭐ [프론트 연동] 로그인 응답에 accessToken 외에 memberId/role을 바로 꺼내 쓸 수 있게 함께 내려줍니다.
// JWT 자체에도 memberId/role claim이 들어 있지만(JwtTokenProvider), 프론트에서 매번 토큰을 디코딩하지
// 않아도 되도록 응답 바디에도 노출합니다.
public record LoginResponse(String accessToken, Long memberId, String role) {
}
