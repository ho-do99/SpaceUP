package com.spaceup.domain.member.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.security.SecureRandom;

// ⭐ [NCP SENS 전환용] 아래 sendSmsViaNcpSens()/makeSensSignature() 주석을 해제할 때 이 import들도 함께 해제하세요.
// import java.net.URI;
// import java.net.http.HttpClient;
// import java.net.http.HttpRequest;
// import java.net.http.HttpResponse;
// import java.nio.charset.StandardCharsets;
// import java.util.Base64;
// import javax.crypto.Mac;
// import javax.crypto.spec.SecretKeySpec;
// import org.springframework.beans.factory.annotation.Value;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.member.dto.MemberResponse;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberApprovalStatus;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.global.error.DuplicateMemberException;
import com.spaceup.global.error.InvalidPasswordException;
import com.spaceup.global.error.InvalidRoleException;
import com.spaceup.global.error.InvalidStatusTransitionException;
import com.spaceup.global.error.InvalidVerificationCodeException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.WithdrawnMemberException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

	// ⭐ [목업 OTP] 인증코드 유효시간
	private static final int VERIFICATION_CODE_TTL_MINUTES = 5;

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;
	private final PhoneVerificationService phoneVerificationService;
	private final SecureRandom secureRandom = new SecureRandom();

	// ⭐ [NCP SENS 전환용] 네이버클라우드 SENS 자격증명 - 프로젝트 기간 동안 발급받기로 함(아직 미발급).
	// 발급받으면 application-local.yml에 ncp.sens.* 값을 채우고 아래 주석을 해제하세요.
	// @Value("${ncp.sens.service-id}")
	// private String sensServiceId;
	//
	// @Value("${ncp.sens.access-key}")
	// private String sensAccessKey;
	//
	// @Value("${ncp.sens.secret-key}")
	// private String sensSecretKey;
	//
	// @Value("${ncp.sens.sender-phone}")
	// private String sensSenderPhone;

	@Transactional
	public Long join(Member member) {
		// ⭐ ADMIN은 이 공개 API로 만들 수 없습니다 (문서에는 명시돼 있었지만 실제 검증 코드가 빠져 있던 부분이라 추가).
		// 관리자 계정은 DB에 직접 시딩하거나 별도 내부 전용 절차로 생성해야 합니다.
		if (member.getRole() == MemberRole.ADMIN) {
			throw new InvalidRoleException("관리자 계정은 이 API로 가입할 수 없습니다.");
		}

		validateDuplicateMember(member.getEmail());

		// ⭐ [프론트 연동] 회원가입 "휴대폰 인증" 단계에서 이 번호로 인증을 마쳤는지 확인합니다.
		// PhoneVerificationService.confirmCode()가 앞서 호출돼 있어야 통과합니다(회원가입 API는 JWT 없이 호출 가능).
		if (!phoneVerificationService.isVerified(member.getPhoneNumber())) {
			throw new InvalidVerificationCodeException("휴대폰 인증을 먼저 완료해 주세요.");
		}

		String encodedPassword = passwordEncoder.encode(member.getPassword());

		// ⭐ 시공사는 관리자 승인 전까지 PENDING으로 가입시킵니다(Figma "심사 대기" 화면 시작점).
		// 임대인은 가입 즉시 이용 가능해야 하므로 APPROVED.
		boolean needsAdminApproval = member.getRole() == MemberRole.CONTRACTOR;
		MemberApprovalStatus initialStatus = needsAdminApproval ? MemberApprovalStatus.PENDING
				: MemberApprovalStatus.APPROVED;

		Member encryptedMember = Member.builder().password(encodedPassword)
				.email(member.getEmail()).name(member.getName()).phoneNumber(member.getPhoneNumber())
				.role(member.getRole()).approvalStatus(initialStatus).phoneVerified(true).build();

		memberRepository.save(encryptedMember);

		// ⭐ [Figma 반영] "심사 대기" 화면의 신청번호(예: ON-260715-018)는 심사가 필요한 역할에만 발급합니다.
		if (needsAdminApproval) {
			encryptedMember.assignApplicationNumber(generateApplicationNumber(encryptedMember.getId()));
		}
		return encryptedMember.getId();
	}

	// ⭐ [프론트 연동] 로그인 성공 시 컨트롤러가 memberId/role로 토큰을 발급해야 해서 boolean 대신 Member를 반환합니다.
	public Member login(String email, String rawPassword) {
		Member member = memberRepository.findByEmail(email).orElse(null);
		if (member == null) {
			return null;
		}
		if (member.isWithdrawn()) {
			// ⭐ 소프트 삭제된 회원: 비밀번호가 맞더라도 로그인 자체를 차단하고 명확한 사유를 안내
			throw new WithdrawnMemberException("이미 탈퇴한 계정입니다: " + email);
		}
		return passwordEncoder.matches(rawPassword, member.getPassword()) ? member : null;
	}

	private void validateDuplicateMember(String email) {
		memberRepository.findByEmail(email).ifPresent(m -> {
			throw new DuplicateMemberException("이미 존재하는 이메일입니다: " + email);
		});
	}

	public MemberResponse getProfile(Long memberId) {
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
		return new MemberResponse(member);
	}

	@Transactional
	public void updateProfile(Long memberId, String email, String name) {
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
		member.updateProfile(email, name);
	}

	// ⭐ [Figma 반영] 마이페이지 - 계정설정의 휴대폰 번호 변경. 실제 SMS 인증 연동 전까지는 변경 시 인증완료 플래그가
	// 초기화됩니다(재인증 필요 상태로 표시만 함).
	@Transactional
	public void updatePhoneNumber(Long memberId, String phoneNumber) {
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
		member.updatePhoneNumber(phoneNumber);
	}

	// ⭐ [Figma 반영] 마이페이지 - 계정설정의 비밀번호 변경. 현재 비밀번호를 먼저 확인한 뒤에만 변경을 허용합니다.
	@Transactional
	public void updatePassword(Long memberId, String currentPassword, String newPassword) {
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
		if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
			throw new InvalidPasswordException("현재 비밀번호가 일치하지 않습니다.");
		}
		member.changePassword(passwordEncoder.encode(newPassword));
	}

	// ⭐ [Figma 반영] "보완 요청" 화면의 "보완 자료 재제출" 버튼 - 본인만 가능, NEEDS_REVISION 상태에서만 허용
	@Transactional
	public void resubmit(Long memberId) {
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
		if (member.getApprovalStatus() != MemberApprovalStatus.NEEDS_REVISION) {
			throw new InvalidStatusTransitionException("보완 요청 상태가 아닌 회원은 재제출할 수 없습니다.");
		}
		member.resubmit();
	}

	@Transactional
	public void withdraw(Long memberId) {
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
		if (member.isWithdrawn()) {
			throw new WithdrawnMemberException("이미 탈퇴 처리된 계정입니다: " + memberId);
		}
		// ⭐ 소프트 삭제: 직접 삭제(delete) 대신 상태만 변경합니다.
		// 견적·채팅·프로젝트 같은 업무 이력이 Member를 참조하므로 하드 삭제를 피하며,
		// 변경 감지(dirty checking)로 트랜잭션 커밋 시점에 자동 반영되므로 별도 save() 호출이 불필요합니다.
		member.withdraw();
	}

	// ⭐ "ON-260715-000018" 형식: ON-yyMMdd-{DB가 발급한 실제 id 6자리}
	private String generateApplicationNumber(Long id) {
		String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
		return String.format("ON-%s-%06d", datePart, id);
	}

	// ⭐ [목업 OTP] 6자리 인증코드를 발급합니다.
	// TODO: 실제 문자 발송은 외부 클라우드 SMS 벤더(예: NCP SENS, Twilio) 연동이 필요합니다.
	// 지금은 그 연동 없이 발급한 코드값을 응답에 그대로 실어 보내는 목업으로 동작합니다 - 연동 전까지는
	// 이 반환값(코드)을 그대로 확인 API에 넣으면 인증이 완료됩니다.
	@Transactional
	public String sendPhoneVerificationCode(Long memberId) {
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
		String code = String.format("%06d", secureRandom.nextInt(1_000_000));
		member.issueVerificationCode(code, LocalDateTime.now().plusMinutes(VERIFICATION_CODE_TTL_MINUTES));
		return code;
	}

	// ===== [NCP SENS 전환용] =====
	// 네이버클라우드 SENS가 발급되면 아래 순서로 전환하세요.
	// 1) 위 목업 버전 sendPhoneVerificationCode()를 통째로 주석 처리
	// 2) 이 블록(메서드 3개)의 주석을 해제
	// 3) 파일 상단의 NCP 관련 import, 그리고 sensServiceId 등 @Value 필드 주석 해제
	// 4) application-local.yml에 ncp.sens.* 값 채우기
	//
	// @Transactional
	// public String sendPhoneVerificationCode(Long memberId) {
	// Member member = memberRepository.findById(memberId)
	// .orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
	// if (member.getPhoneNumber() == null) {
	// throw new InvalidStatusTransitionException("휴대폰 번호가 등록되어 있지 않습니다.");
	// }
	// String code = String.format("%06d", secureRandom.nextInt(1_000_000));
	// member.issueVerificationCode(code, LocalDateTime.now().plusMinutes(VERIFICATION_CODE_TTL_MINUTES));
	// sendSmsViaNcpSens(member.getPhoneNumber(), String.format("[Spaceup] 인증번호 [%s]를 입력해 주세요.", code));
	// // 실제 발송 모드에서는 코드값을 API 응답에 그대로 노출하면 안 되므로 null을 반환합니다
	// // (컨트롤러의 성공 메시지도 "문자로 발송된 인증코드를 입력해 주세요" 식으로 같이 바꿔주세요).
	// return null;
	// }
	//
	// // ⭐ NCP SENS(Simple & Easy Notification Service) SMS 발송 API 호출.
	// // 문서: https://api.ncloud-docs.com/docs/ai-application-service-sens-smsv2
	// private void sendSmsViaNcpSens(String to, String content) {
	// try {
	// String path = "/sms/v2/services/" + sensServiceId + "/messages";
	// String timestamp = String.valueOf(System.currentTimeMillis());
	// String signature = makeSensSignature(timestamp, path);
	//
	// String body = String.format(
	// "{\"type\":\"SMS\",\"from\":\"%s\",\"content\":\"%s\",\"messages\":[{\"to\":\"%s\"}]}", sensSenderPhone,
	// content, to);
	//
	// HttpRequest request = HttpRequest.newBuilder().uri(URI.create("https://sens.apigw.ntruss.com" + path))
	// .header("Content-Type", "application/json; charset=utf-8")
	// .header("x-ncp-apigw-timestamp", timestamp).header("x-ncp-iam-access-key", sensAccessKey)
	// .header("x-ncp-apigw-signature-v2", signature)
	// .POST(HttpRequest.BodyPublishers.ofString(body)).build();
	//
	// HttpResponse<String> response = HttpClient.newHttpClient().send(request,
	// HttpResponse.BodyHandlers.ofString());
	// if (response.statusCode() != 202) {
	// throw new IllegalStateException("NCP SENS 발송 실패: " + response.statusCode() + " " + response.body());
	// }
	// } catch (Exception e) {
	// throw new IllegalStateException("SMS 발송 중 오류가 발생했습니다.", e);
	// }
	// }
	//
	// // ⭐ NCP SENS 서명 규칙: HMAC-SHA256("POST" + " " + path + "\n" + timestamp + "\n" + accessKey)를
	// // secretKey로 서명 후 Base64 인코딩
	// private String makeSensSignature(String timestamp, String path) throws Exception {
	// String message = "POST" + " " + path + "\n" + timestamp + "\n" + sensAccessKey;
	// Mac mac = Mac.getInstance("HmacSHA256");
	// mac.init(new SecretKeySpec(sensSecretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
	// byte[] rawHmac = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
	// return Base64.getEncoder().encodeToString(rawHmac);
	// }

	// ⭐ [목업 OTP] 발급된 코드와 대조해 일치하면 phoneVerified=true로 전환합니다.
	@Transactional
	public void confirmPhoneVerification(Long memberId, String code) {
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
		if (!member.verifyCode(code)) {
			throw new InvalidVerificationCodeException("인증코드가 올바르지 않거나 만료되었습니다.");
		}
	}

	// ⭐ [이메일 인증, 목업] 휴대폰 인증과 동일한 패턴. 실제 이메일 발송 연동 전까지는 발급한 코드값을 응답에
	// 그대로 실어 보냅니다.
	// TODO: 실제 이메일 발송은 외부 메일 발송 서비스(예: NCP Cloud Outbound Mailer, SES) 연동이 필요합니다.
	@Transactional
	public String sendEmailVerificationCode(Long memberId) {
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
		String code = String.format("%06d", secureRandom.nextInt(1_000_000));
		member.issueEmailVerificationCode(code, LocalDateTime.now().plusMinutes(VERIFICATION_CODE_TTL_MINUTES));
		return code;
	}

	// ⭐ [이메일 인증, 목업] 발급된 코드와 대조해 일치하면 emailVerified=true로 전환합니다.
	@Transactional
	public void confirmEmailVerification(Long memberId, String code) {
		Member member = memberRepository.findById(memberId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + memberId));
		if (!member.verifyEmailCode(code)) {
			throw new InvalidVerificationCodeException("인증코드가 올바르지 않거나 만료되었습니다.");
		}
	}
}
