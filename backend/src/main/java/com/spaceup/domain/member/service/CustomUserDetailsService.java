package com.spaceup.domain.member.service;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.member.security.MemberPrincipal;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

	private final MemberRepository memberRepository;

	/**
	 * ⭐ 시큐리티 핵심 연동 메서드: 로그인 식별자(email)로 DB에서 회원을 찾아 시큐리티 규격으로 리턴합니다.
	 * 메서드명은 Spring Security의 UserDetailsService 계약이라 loadUserByUsername으로 고정입니다.
	 */
	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		Member member = memberRepository.findByEmail(email)
				.orElseThrow(() -> new UsernameNotFoundException("DB에 존재하지 않는 이메일입니다: " + email));
		return new MemberPrincipal(member);
	}
}