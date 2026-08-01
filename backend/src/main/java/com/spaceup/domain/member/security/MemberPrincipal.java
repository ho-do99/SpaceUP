package com.spaceup.domain.member.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.spaceup.domain.member.entity.Member;

import java.util.Collection;
import java.util.List;

public class MemberPrincipal implements UserDetails {
	private final Long id;
	private final String username;
	private final String password;
	private final boolean enabled;
	private final String role; // ⭐ Member.role을 그대로 실어서 SecurityConfig의 hasRole("CONTRACTOR") 등에 사용

	public MemberPrincipal(Member member) {
		this.id = member.getId();
		this.username = member.getUsername();
		this.password = member.getPassword();
		this.enabled = !member.isWithdrawn(); // 탈퇴 회원은 비활성 계정으로 취급
		this.role = member.getRole() != null ? member.getRole().name() : "LANDLORD";
	}

	public Long getId() {
		return id;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		// ⭐ Spring Security 규약상 "ROLE_" 접두사가 붙어야 hasRole("CONTRACTOR") 형태로 매칭됩니다.
		return List.of(new SimpleGrantedAuthority("ROLE_" + role));
	}

	@Override
	public String getPassword() {
		return password;
	}

	@Override
	public String getUsername() {
		return username;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return enabled;
	}
}