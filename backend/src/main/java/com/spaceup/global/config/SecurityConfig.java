package com.spaceup.global.config;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.spaceup.global.security.JwtAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	// ⭐ [프론트 연동] 프론트(Vite 개발서버, localhost:5173)와 백엔드(localhost:8087)가 다른 포트라
	// 브라우저가 CORS 프리플라이트를 보냅니다. Authorization 헤더를 명시적으로 허용해야 JWT가 붙은 요청이 통과합니다.
	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(List.of("http://localhost:5173", "http://127.0.0.1:5173"));
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
		config.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource)
			throws Exception {
		http.csrf(csrf -> csrf.disable()).cors(cors -> cors.configurationSource(corsConfigurationSource))
				.headers(headers -> headers.frameOptions(frame -> frame.disable()))
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/api/member/join", "/api/member/login",
								"/api/member/join/phone/verify-code/send", "/api/member/join/phone/verify-code/confirm")
						.permitAll()
						// ⭐ [프론트 연동] 업로드된 이미지는 <img src="..."> 태그로 바로 렌더링되므로(Authorization
						// 헤더를 실어 보낼 수 없음) 조회(GET)만 공개합니다. 업로드(POST)는 여전히 인증이 필요합니다.
						.requestMatchers(HttpMethod.GET, "/api/files/images/**").permitAll()
						// ⭐ [프론트 연동] "리뷰" 조회는 로그인 없이도 시공사 상세 화면 등에서 노출됩니다. 작성(POST)은 인증 필요.
						.requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
						// ⭐ [사전 존재 버그 수정] 시공사 공개 상세/포트폴리오/상품 목록은 원래 로그인 없이 조회 가능하게
						// 만들었는데 permitAll이 누락되어 anyRequest().authenticated()에 걸려 401이 나고 있었습니다.
						// "/me" 류 경로는 와일드카드 permitAll보다 먼저 선언해야 인증이 그대로 유지됩니다
						// (Spring Security는 먼저 매칭되는 규칙을 적용).
						.requestMatchers(HttpMethod.GET, "/api/contractors/me").authenticated()
						.requestMatchers(HttpMethod.GET, "/api/contractors/*").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/portfolios/me").authenticated()
						.requestMatchers(HttpMethod.GET, "/api/portfolios/*", "/api/portfolios/contractor/*")
						.permitAll()
						.requestMatchers(HttpMethod.GET, "/api/products", "/api/products/*").permitAll()
						// ⭐ [프론트 연동] "아파트/평면도 검색"은 로그인 없이 조회 가능, 등록은 관리자만
						.requestMatchers(HttpMethod.GET, "/api/floorplans/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/floorplans/**").hasRole("ADMIN")
						// ⭐ 확장 지점: 관리자 전용 API가 생기면 아래처럼 역할별로 제한하세요.
						// ⭐ 확장 지점: 다른 역할별 제한이 필요해지면 이런 식으로 추가하세요.
						// .requestMatchers("/api/quotes/**").hasAnyRole("CONTRACTOR", "LANDLORD")
						.requestMatchers(HttpMethod.POST, "/api/rental-transactions/sync").hasRole("ADMIN")
						.requestMatchers("/api/admin/**").hasRole("ADMIN")
						// ⭐ 정산 생성/완료 처리는 관리자만 (조회는 본인 소유 검증을 서비스 레이어에서 별도로 함)
						.requestMatchers(HttpMethod.POST, "/api/settlements").hasRole("ADMIN")
						.requestMatchers(HttpMethod.POST, "/api/settlements/*/complete").hasRole("ADMIN")
						.anyRequest().authenticated())
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
				.formLogin(form -> form.disable()).httpBasic(basic -> basic.disable());

		return http.build();
	}
}
