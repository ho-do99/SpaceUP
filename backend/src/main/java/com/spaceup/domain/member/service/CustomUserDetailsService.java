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
	 * ⭐ 시큐리티 핵심 연동 메서드: 사용자가 입력한 ID로 DB에서 회원을 찾아 시큐리티 규격으로 리턴합니다.
	 */
	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		Member member = memberRepository.findByUsername(username)
				.orElseThrow(() -> new UsernameNotFoundException("DB에 존재하지 않는 사용자 아이디입니다: " + username));
		return new MemberPrincipal(member);
	}
}