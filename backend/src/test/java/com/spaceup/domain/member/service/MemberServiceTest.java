package com.spaceup.domain.member.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberApprovalStatus;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.member.repository.MemberRepository;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

	@Mock
	private MemberRepository memberRepository;
	@Mock
	private PasswordEncoder passwordEncoder;
	@Mock
	private PhoneVerificationService phoneVerificationService;

	private MemberService memberService;

	// ⭐ [관리자 심사 제거] 이제 시공사도 가입 즉시 APPROVED + 승인번호까지 자동 발급되는지 검증합니다.
	@Test
	void contractorIsAutoApprovedOnJoin() {
		memberService = new MemberService(memberRepository, passwordEncoder, phoneVerificationService);
		Member requested = Member.builder().email("contractor@test.com").password("raw1234!")
				.name("시공사").phoneNumber("01012345678").role(MemberRole.CONTRACTOR).build();

		when(memberRepository.findByEmail("contractor@test.com")).thenReturn(Optional.empty());
		when(phoneVerificationService.isVerified("01012345678")).thenReturn(true);
		when(passwordEncoder.encode(anyString())).thenReturn("encoded");
		when(memberRepository.save(any(Member.class))).thenAnswer(invocation -> {
			Member member = invocation.getArgument(0);
			member.assignApplicationNumber("ON-000000-000001");
			return member;
		});

		memberService.join(requested);

		ArgumentCaptor<Member> savedCaptor = ArgumentCaptor.forClass(Member.class);
		org.mockito.Mockito.verify(memberRepository).save(savedCaptor.capture());
		Member saved = savedCaptor.getValue();
		assertThat(saved.getApprovalStatus()).isEqualTo(MemberApprovalStatus.APPROVED);
		assertThat(saved.getApprovalNumber()).isNotBlank();
	}

	@Test
	void landlordIsAlreadyApprovedOnJoin() {
		memberService = new MemberService(memberRepository, passwordEncoder, phoneVerificationService);
		Member requested = Member.builder().email("landlord@test.com").password("raw1234!")
				.name("임대인").phoneNumber("01099998888").role(MemberRole.LANDLORD).build();

		when(memberRepository.findByEmail("landlord@test.com")).thenReturn(Optional.empty());
		when(phoneVerificationService.isVerified("01099998888")).thenReturn(true);
		when(passwordEncoder.encode(anyString())).thenReturn("encoded");

		memberService.join(requested);

		ArgumentCaptor<Member> savedCaptor = ArgumentCaptor.forClass(Member.class);
		org.mockito.Mockito.verify(memberRepository).save(savedCaptor.capture());
		Member saved = savedCaptor.getValue();
		assertThat(saved.getApprovalStatus()).isEqualTo(MemberApprovalStatus.APPROVED);
		assertThat(saved.getApprovalNumber()).isNull();
	}
}
