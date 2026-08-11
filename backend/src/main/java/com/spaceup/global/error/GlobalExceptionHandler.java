package com.spaceup.global.error;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException; // 👈 검증 예외 부품 링크
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import com.spaceup.domain.ai.exception.AiImageGenerationConfigurationException;
import com.spaceup.domain.ai.exception.AiImageGenerationException;
import com.spaceup.domain.analysis.ai.exception.AiFloorplanAnalysisException;
import com.spaceup.domain.rental.exception.RentalApiConfigurationException;
import com.spaceup.domain.rental.exception.RentalApiException;
import com.spaceup.global.util.ApiResponse;

import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

	// ⭐ [프론트 연동] 이미지 업로드 등 multipart 요청이 spring.servlet.multipart.max-file-size(20MB)를
	// 넘으면 스프링이 이 예외를 던집니다. 별도 핸들러가 없으면 500으로 떨어져서 413으로 명확히 구분합니다.
	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<ApiResponse<Void>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException e) {
		log.warn("업로드 파일 용량 초과: {}", e.getMessage());
		return ResponseEntity.status(413).body(ApiResponse.fail("파일 크기가 20MB를 초과했습니다."));
	}

	// ⭐ [국토부 실거래가 연동] 서비스키 미설정 등 설정 오류 - 운영자가 바로 인지할 수 있도록 503
	@ExceptionHandler(RentalApiConfigurationException.class)
	public ResponseEntity<ApiResponse<Void>> handleRentalApiConfigurationException(
			RentalApiConfigurationException e) {
		log.warn("전월세 API 설정 오류: {}", e.getMessage());
		return ResponseEntity.status(503).body(ApiResponse.fail(e.getMessage()));
	}

	// ⭐ [국토부 실거래가 연동] 외부 API 호출/응답 파싱 실패 - 우리 서버 문제가 아니라 상위 게이트웨이(502) 성격
	@ExceptionHandler(RentalApiException.class)
	public ResponseEntity<ApiResponse<Void>> handleRentalApiException(RentalApiException e) {
		log.warn("전월세 외부 API 오류: {}", e.getMessage());
		return ResponseEntity.status(502).body(ApiResponse.fail(e.getMessage()));
	}

	// ⭐ [국토부 실거래가 연동] dealYm(존재하지 않는 연월) 등 값 자체는 형식은 맞지만 의미상 잘못된 경우
	@ExceptionHandler({ IllegalArgumentException.class, ConstraintViolationException.class })
	public ResponseEntity<ApiResponse<Void>> handleRentalRequestValidationException(Exception e) {
		log.warn("전월세 API 요청값 오류: {}", e.getMessage());
		return ResponseEntity.status(400).body(ApiResponse.fail(e.getMessage()));
	}

	// ⭐ 2차 고도화 추가: 형식 검증 에러(@Valid) 발생 시 첫 번째 오타 원인 문구만 낚아채 응답하는 포획선 [우선순위]
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
		// 가방 안에 쌓인 오타 원인 명단 중 맨 첫 번째 실패 문구(message)를 추출
		String defaultMessage = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
		log.warn("데이터 검증 실패: {}", defaultMessage);
		return ResponseEntity.status(400).body(ApiResponse.fail(defaultMessage));
	}

	@ExceptionHandler(DuplicateMemberException.class)
	public ResponseEntity<ApiResponse<Void>> handleDuplicateMemberException(DuplicateMemberException e) {
		log.warn("회원가입 실패 (아이디 중복): {}", e.getMessage());
		return ResponseEntity.status(400).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(MemberNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleMemberNotFoundException(MemberNotFoundException e) {
		log.warn("회원 조회 실패: {}", e.getMessage());
		return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponse<Void>> handleAllException(Exception e) {
		log.error("시스템 치명적 에러 발생: ", e);
		return ResponseEntity.status(500).body(ApiResponse.fail("서버 내부 시스템 오류가 발생했습니다. 관리자에게 문의하세요."));
	}

	@ExceptionHandler(UnauthorizedAccessException.class)
	public ResponseEntity<ApiResponse<Void>> handleUnauthorizedAccessException(UnauthorizedAccessException e) {
		log.warn("권한 없는 접근 시도: {}", e.getMessage());
		return ResponseEntity.status(403).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(FileNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleFileNotFoundException(FileNotFoundException e) {
		log.warn("파일 조회 실패: {}", e.getMessage());
		return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(WithdrawnMemberException.class)
	public ResponseEntity<ApiResponse<Void>> handleWithdrawnMemberException(WithdrawnMemberException e) {
		log.warn("탈퇴 회원 로그인 시도: {}", e.getMessage());
		return ResponseEntity.status(403).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(RequestNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleRequestNotFoundException(RequestNotFoundException e) {
		log.warn("의뢰 조회 실패: {}", e.getMessage());
		return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(QuoteNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleQuoteNotFoundException(QuoteNotFoundException e) {
		log.warn("견적 조회 실패: {}", e.getMessage());
		return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(InvalidStatusTransitionException.class)
	public ResponseEntity<ApiResponse<Void>> handleInvalidStatusTransitionException(
			InvalidStatusTransitionException e) {
		log.warn("잘못된 상태 변경 시도: {}", e.getMessage());
		return ResponseEntity.status(409).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(SettlementNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleSettlementNotFoundException(SettlementNotFoundException e) {
		log.warn("정산 내역 조회 실패: {}", e.getMessage());
		return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(NotificationNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleNotificationNotFoundException(NotificationNotFoundException e) {
		log.warn("알림 조회 실패: {}", e.getMessage());
		return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(InvalidRoleException.class)
	public ResponseEntity<ApiResponse<Void>> handleInvalidRoleException(InvalidRoleException e) {
		log.warn("허용되지 않은 역할의 접근: {}", e.getMessage());
		return ResponseEntity.status(403).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(AnalysisNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleAnalysisNotFoundException(AnalysisNotFoundException e) {
		log.warn("분석 결과 조회 실패: {}", e.getMessage());
		return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(SettingNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleSettingNotFoundException(SettingNotFoundException e) {
		log.warn("시스템 설정 조회 실패: {}", e.getMessage());
		return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(ForbiddenAccessException.class)
	public ResponseEntity<ApiResponse<Void>> handleForbiddenAccessException(ForbiddenAccessException e) {
		log.warn("본인 소유가 아닌 리소스 접근 시도: {}", e.getMessage());
		return ResponseEntity.status(403).body(ApiResponse.fail(e.getMessage()));
	}

	// ⭐ [최종 검토 반영] 재고 부족(오버셀 시도) 예외 핸들러. 상태 충돌 성격이라 409로 통일.
	// ⭐ [Figma 반영] 포트폴리오 없음 예외 핸들러
	@ExceptionHandler(PortfolioNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handlePortfolioNotFoundException(PortfolioNotFoundException e) {
		log.warn("포트폴리오 조회 실패: {}", e.getMessage());
		return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
	}

	// ⭐ [목업 OTP] 인증코드 불일치/만료 예외 핸들러
	@ExceptionHandler(InvalidVerificationCodeException.class)
	public ResponseEntity<ApiResponse<Void>> handleInvalidVerificationCodeException(
			InvalidVerificationCodeException e) {
		log.warn("휴대폰 인증코드 검증 실패: {}", e.getMessage());
		return ResponseEntity.status(400).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(InvalidPasswordException.class)
	public ResponseEntity<ApiResponse<Void>> handleInvalidPasswordException(InvalidPasswordException e) {
		log.warn("비밀번호 변경 실패: {}", e.getMessage());
		return ResponseEntity.status(400).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(SiteVisitNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleSiteVisitNotFoundException(SiteVisitNotFoundException e) {
		log.warn("현장방문 일정 조회 실패: {}", e.getMessage());
		return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(ReviewNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleReviewNotFoundException(ReviewNotFoundException e) {
		log.warn("리뷰 조회 실패: {}", e.getMessage());
		return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(ProjectNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleProjectNotFoundException(ProjectNotFoundException e) {
		log.warn("프로젝트 조회 실패: {}", e.getMessage());
		return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
	}

	// ⭐ [AI 인테리어 이미지 생성] GEMINI_API_KEY 미설정 - 운영자가 바로 인지할 수 있도록 503
	@ExceptionHandler(AiImageGenerationConfigurationException.class)
	public ResponseEntity<ApiResponse<Void>> handleAiImageGenerationConfigurationException(
			AiImageGenerationConfigurationException e) {
		log.warn("AI 이미지 생성 설정 오류: {}", e.getMessage());
		return ResponseEntity.status(503).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(AiImageGenerationException.class)
	public ResponseEntity<ApiResponse<Void>> handleAiImageGenerationException(AiImageGenerationException e) {
		log.warn("AI 이미지 생성 실패: {}", e.getMessage());
		return ResponseEntity.status(502).body(ApiResponse.fail(e.getMessage()));
	}

	// ⭐ [AI/OCR 연동] AI 평면도 분석 서비스(origin/ai, 포트 8004) 호출 실패 - 502
	@ExceptionHandler(AiFloorplanAnalysisException.class)
	public ResponseEntity<ApiResponse<Void>> handleAiFloorplanAnalysisException(AiFloorplanAnalysisException e) {
		log.warn("AI 평면도 분석 실패: {}", e.getMessage());
		return ResponseEntity.status(502).body(ApiResponse.fail(e.getMessage()));
	}

	@ExceptionHandler(ApartmentNotFoundException.class)
	public ResponseEntity<ApiResponse<Void>> handleApartmentNotFoundException(ApartmentNotFoundException e) {
		log.warn("아파트 조회 실패: {}", e.getMessage());
		return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
	}

	// ⭐ [동시성 수정] Product.version(@Version) 등 낙관적 락이 걸린 엔티티를 두 트랜잭션이 동시에 수정하면
	// 나중에 커밋하는 쪽이 이 예외를 받습니다. 그대로 두면 500으로 떨어지므로 "다시 시도해 달라"는 409로 응답합니다.
	@ExceptionHandler(ObjectOptimisticLockingFailureException.class)
	public ResponseEntity<ApiResponse<Void>> handleObjectOptimisticLockingFailureException(
			ObjectOptimisticLockingFailureException e) {
		log.warn("동시 수정 충돌 발생: {}", e.getMessage());
		return ResponseEntity.status(409).body(ApiResponse.fail("다른 요청과 동시에 처리되어 충돌이 발생했습니다. 다시 시도해 주세요."));
	}

	// ⭐ [동시성 수정] 유니크 제약조건 위반(동시 생성 레이스) 등 DB 무결성 위반을 500 대신 409로 명확히 구분합니다.
	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolationException(DataIntegrityViolationException e) {
		log.warn("데이터 무결성 제약 위반: {}", e.getMessage());
		return ResponseEntity.status(409).body(ApiResponse.fail("요청을 처리할 수 없습니다. 이미 존재하는 데이터이거나 잘못된 상태입니다."));
	}

	// ⭐ [검증 강화] 요청 본문이 JSON 형식 자체는 맞지만 의미상 잘못된 경우(예: enum에 없는 문자열 값,
	// 리뷰 keywords에 고정 4종 외의 값을 보낸 경우)를 500 대신 400으로 응답합니다.
	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadableException(HttpMessageNotReadableException e) {
		log.warn("요청 본문 파싱 실패: {}", e.getMessage());
		return ResponseEntity.status(400).body(ApiResponse.fail("요청 본문의 값이 올바르지 않습니다."));
	}
}
