package com.spaceup.global.config;

import java.util.List;
import java.util.Arrays;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
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

	@Value("${app.cors.allowed-origins}")
	private String allowedOrigins;

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	// ⭐ [프론트 연동] 프론트(Vite 개발서버, localhost:5173)와 백엔드(localhost:8087)가 다른 포트라
	// 브라우저가 CORS 프리플라이트를 보냅니다. Authorization 헤더를 명시적으로 허용해야 JWT가 붙은 요청이 통과합니다.
	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
				.map(String::trim)
				.filter(origin -> !origin.isBlank())
				.toList());
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
		config.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}

	// ⭐ Spring MVC의 HandlerMappingIntrospector도 CorsConfigurationSource를 구현하고 있어서 같은 타입 빈이
	// 2개 존재합니다. 파라미터 이름으로 자동 구분되긴 하지만, 그건 컴파일러가 -parameters 플래그로 파라미터명을
	// 남겨줘야만 동작합니다 (Gradle은 설정돼 있지만, Eclipse 등 IDE 자체 컴파일러는 기본값이 꺼져 있을 수 있어
	// "required a single bean, but 2 were found" 오류가 남). @Qualifier로 명시해 컴파일러 설정과 무관하게
	// 항상 우리가 만든 빈을 쓰도록 고정합니다.
	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http,
			@Qualifier("corsConfigurationSource") CorsConfigurationSource corsConfigurationSource) throws Exception {
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
						// ⭐ [프론트 연동] 시공사 회원가입 중 사업자등록증 업로드 - 계정이 아직 없어 JWT 없이 호출됩니다.
						.requestMatchers("/api/files/business-documents/**").permitAll()
						// ⭐ [프론트 연동] 시공사 회원가입 중 사업자등록번호 확인(목업) - 계정이 아직 없어 JWT 없이 호출됩니다.
						.requestMatchers(HttpMethod.POST, "/api/contractors/business-registration/verify").permitAll()
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
						.requestMatchers(HttpMethod.GET, "/api/material-products", "/api/material-products/*")
						.permitAll()
						// ⭐ [프론트 연동] "아파트/평면도 검색"은 로그인 없이 조회 가능, 등록은 관리자만
						.requestMatchers(HttpMethod.GET, "/api/floorplans/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/floorplans/**").hasRole("ADMIN")
						// ⭐ [보안 수정] ML 파이프라인 콜백/관리자 수동 보정 용도라 특정 임대인·시공사 소유권 개념이
						// 없습니다. 실제 ML 서비스 간 인증이 생기기 전까지는 관리자만 호출 가능하도록 제한합니다.
						.requestMatchers(HttpMethod.POST, "/api/analysis/request/*/result",
								"/api/analysis/request/*/fail")
						.hasRole("ADMIN")
						// ⭐ 확장 지점: 관리자 전용 API가 생기면 아래처럼 역할별로 제한하세요.
						// ⭐ 확장 지점: 다른 역할별 제한이 필요해지면 이런 식으로 추가하세요.
						// .requestMatchers("/api/quotes/**").hasAnyRole("CONTRACTOR", "LANDLORD")
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
