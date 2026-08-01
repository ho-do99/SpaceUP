package com.spaceup.global.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

	private final SecretKey key;
	private final long expirationMs;

	public JwtTokenProvider(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration-ms}") long expirationMs) {
		this.key = Keys.hmacShaKeyFor(secret.getBytes());
		this.expirationMs = expirationMs;
	}

	public String createToken(String username, Long memberId, String role) {
		Date now = new Date();
		Date expiry = new Date(now.getTime() + expirationMs);

		return Jwts.builder().subject(username).claim("memberId", memberId).claim("role", role).issuedAt(now)
				.expiration(expiry).signWith(key).compact();
	}

	public String getUsername(String token) {
		return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject();
	}

	// ⭐ [프론트 연동] 로그인 응답에 memberId/role을 함께 내려주기 위해 토큰 발급 직후 바로 읽어옵니다.
	public Long getMemberId(String token) {
		return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().get("memberId",
				Long.class);
	}

	public String getRole(String token) {
		return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().get("role", String.class);
	}

	public boolean validateToken(String token) {
		try {
			Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
			return true;
		} catch (Exception e) {
			return false;
		}
	}
}