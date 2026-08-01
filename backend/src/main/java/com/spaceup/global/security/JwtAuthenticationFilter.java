package com.spaceup.global.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.spaceup.domain.member.service.CustomUserDetailsService;

import lombok.RequiredArgsConstructor;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtTokenProvider jwtTokenProvider;
	private final CustomUserDetailsService userDetailsService;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		String header = request.getHeader("Authorization");

		if (header != null && header.startsWith("Bearer ")) {
			String token = header.substring(7);
			if (jwtTokenProvider.validateToken(token)) {
				String username = jwtTokenProvider.getUsername(token);
				UserDetails userDetails = userDetailsService.loadUserByUsername(username);

				// ⭐ 탈퇴(소프트 삭제)된 회원은 토큰이 아직 유효기간 내라도 인증 컨텍스트를 세팅하지 않습니다.
				// 이러면 이후 필터 체인의 authorizeHttpRequests().anyRequest().authenticated()에서
				// 인증되지 않은 요청으로 처리되어 자연스럽게 401로 거부됩니다.
				if (userDetails.isEnabled()) {
					UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
							userDetails, null, userDetails.getAuthorities());
					authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
					SecurityContextHolder.getContext().setAuthentication(authentication);
				}
			}
		}
		filterChain.doFilter(request, response);
	}
}