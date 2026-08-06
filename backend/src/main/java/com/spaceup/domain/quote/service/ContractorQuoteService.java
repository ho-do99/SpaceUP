package com.spaceup.domain.quote.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.analysis.repository.AnalysisJobRepository;
import com.spaceup.domain.analysis.service.RentalValueCalculator;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.entity.NotificationType;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.quote.dto.ContractorQuoteCreateRequest;
import com.spaceup.domain.quote.dto.ContractorQuoteItemRequest;
import com.spaceup.domain.quote.dto.ContractorQuoteResponse;
import com.spaceup.domain.quote.entity.ContractorQuote;
import com.spaceup.domain.quote.entity.ContractorQuoteItem;
import com.spaceup.domain.quote.entity.QuoteStatus;
import com.spaceup.domain.quote.repository.ContractorQuoteRepository;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.InvalidStatusTransitionException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.QuoteNotFoundException;
import com.spaceup.global.error.RequestNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContractorQuoteService {

	// ⭐ [Figma 반영] 기본 유효기간: 발송일로부터 14일 (화면 예시상 07.15 발송 → 07.31 만료와 유사한 기본값)
	private static final int DEFAULT_VALIDITY_DAYS = 14;

	private final ContractorQuoteRepository contractorQuoteRepository;
	private final QuoteRequestRepository quoteRequestRepository;
	private final MemberRepository memberRepository;
	private final NotificationService notificationService;
	private final AnalysisJobRepository analysisJobRepository;
	private final RentalValueCalculator rentalValueCalculator;

	// ⭐ PDF "임시 저장" 버튼 → DRAFT 상태로 생성. 항목 금액 합계 + 부가세 - 할인 = 최종 견적으로 자동 계산합니다.
	@Transactional
	public Long createDraft(Long contractorId, ContractorQuoteCreateRequest dto) {
		QuoteRequest request = quoteRequestRepository.findById(dto.getRequestId())
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + dto.getRequestId()));
		// ⭐ [보안 수정] 배정받지 않은 시공사가 견적을 작성하면 이후 계약전환/프로젝트 진행 단계에서
		// request.getContractor()가 이 견적의 작성자와 달라 NPE가 나던 문제를 원천 차단합니다.
		if (request.getContractor() == null || !request.getContractor().getId().equals(contractorId)) {
			throw new ForbiddenAccessException("본인에게 배정된 의뢰에만 견적을 작성할 수 있습니다.");
		}
		Member contractor = memberRepository.findById(contractorId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 시공사입니다: " + contractorId));

		long materialCost = sumByCategory(dto.getItems());

		ContractorQuote quote = ContractorQuote.builder().request(request).contractor(contractor)
				.title(dto.getTitle()).startDate(dto.getStartDate()).durationDays(dto.getDurationDays())
				.materialCost(dto.getMaterialCost() != null ? dto.getMaterialCost() : materialCost)
				.laborCost(dto.getLaborCost()).vat(dto.getVat()).discount(dto.getDiscount())
				.detailContent(dto.getDetailContent()).status(QuoteStatus.DRAFT).build();

		dto.getItems().forEach(itemDto -> quote.addItem(ContractorQuoteItem.builder()
				.category(itemDto.getCategory()).description(itemDto.getDescription()).amount(itemDto.getAmount())
				.build()));

		quote.recalculateTotal();
		contractorQuoteRepository.save(quote);
		return quote.getId();
	}

	// ⭐ PDF "견적 제안 보내기" 버튼 - 작성한 시공사 본인만 발송 가능. 임대인에게 알림
	// ⭐ [Figma 반영] 발송 시점에 유효기간(validUntil)이 없으면 기본 14일로 채웁니다.
	@Transactional
	public void submit(Long quoteId, Long contractorId) {
		ContractorQuote quote = findQuoteOrThrow(quoteId);
		validateContractorOwnership(quote, contractorId);
		quote.submit();
		if (quote.getValidUntil() == null) {
			quote.extendValidUntil(LocalDate.now().plusDays(DEFAULT_VALIDITY_DAYS));
		}

		notificationService.notify(quote.getRequest().getOwner().getId(), NotificationType.QUOTE, "새 견적이 도착했습니다",
				String.format("%s님이 %,d원 견적을 보냈습니다.", quote.getContractor().getName(), quote.getTotalAmount()));
	}

	// ⭐ 임대인이 최종 선택 - 해당 의뢰의 임대인 본인만 가능. 시공사에게 알림
	@Transactional
	public void accept(Long quoteId, Long landlordId) {
		ContractorQuote quote = findQuoteOrThrow(quoteId);
		validateLandlordOwnership(quote, landlordId);
		// ⭐ [보안 수정] 이미 이 의뢰에 수락된 견적이 있으면 중복 수락을 막습니다(두 시공사가 모두 낙찰됐다고
		// 알림을 받는 것을 방지).
		contractorQuoteRepository
				.findFirstByRequestIdAndStatusOrderByUpdatedAtDesc(quote.getRequest().getId(), QuoteStatus.ACCEPTED)
				.ifPresent(existing -> {
					throw new InvalidStatusTransitionException("이미 이 의뢰에 수락된 견적이 있습니다.");
				});
		quote.accept();
		applyConfirmedRentalValue(quote);

		notificationService.notify(quote.getContractor().getId(), NotificationType.QUOTE, "견적이 선택되었습니다",
				String.format("%s 견적이 최종 선택되었습니다. 일정을 등록해 주세요.", quote.getTitle()));
	}

	// ⭐ [고도화] 견적이 확정된 시점의 실제 견적금액(totalAmount)으로 임대가치 상승분을 재계산해 확정 필드에 반영합니다.
	// 분석 레코드가 아직 없을 수도 있으므로(예: 분석 요청이 실패했거나 아직 진행 중) 조용히 무시합니다.
	private void applyConfirmedRentalValue(ContractorQuote quote) {
		QuoteRequest request = quote.getRequest();
		RentalValueCalculator.Result confirmed = rentalValueCalculator.calculate(
				request.getProperty().getCurrentDeposit(), request.getProperty().getCurrentMonthlyRent(),
				quote.getTotalAmount(), null, null);
		if (confirmed == null) {
			return;
		}
		analysisJobRepository.findByRequestId(request.getId())
				.ifPresent(analysis -> analysis.applyConfirmedRentalValue(confirmed.depositIncreaseMin(),
						confirmed.depositIncreaseMax(), confirmed.rentIncreaseMin(), confirmed.rentIncreaseMax()));
	}

	@Transactional
	public void reject(Long quoteId, Long landlordId) {
		ContractorQuote quote = findQuoteOrThrow(quoteId);
		validateLandlordOwnership(quote, landlordId);
		quote.reject();

		notificationService.notify(quote.getContractor().getId(), NotificationType.QUOTE, "견적이 거절되었습니다",
				String.format("%s 견적이 거절되었습니다.", quote.getTitle()));
	}

	// ⭐ [Figma 반영] "유효기간 연장" 화면 - 작성한 시공사 본인만 가능
	@Transactional
	public void extendValidity(Long quoteId, Long contractorId, LocalDate newValidUntil) {
		ContractorQuote quote = findQuoteOrThrow(quoteId);
		validateContractorOwnership(quote, contractorId);
		quote.extendValidUntil(newValidUntil);

		notificationService.notify(quote.getRequest().getOwner().getId(), NotificationType.QUOTE,
				"견적 유효기간이 연장되었습니다",
				String.format("%s 견적의 유효기간이 %s까지 연장되었습니다.", quote.getTitle(), newValidUntil));
	}

	// ⭐ [Figma 반영] "보낸 견적 상세 - 수정 요청" 화면 - 해당 의뢰의 임대인 본인만 가능. 시공사에게 알림
	@Transactional
	public void requestRevision(Long quoteId, Long landlordId, String note) {
		ContractorQuote quote = findQuoteOrThrow(quoteId);
		validateLandlordOwnership(quote, landlordId);
		quote.requestRevision(note);

		notificationService.notify(quote.getContractor().getId(), NotificationType.QUOTE, "견적 수정 요청이 도착했습니다",
				String.format("%s 견적에 대한 수정 요청: %s", quote.getTitle(), note));
	}

	// ⭐ [보안 수정] 작성한 시공사 본인 또는 해당 의뢰의 임대인만 조회 가능 (경쟁 업체의 미발송 견적 단가 열람 차단)
	public ContractorQuoteResponse getQuote(Long quoteId, Long memberId) {
		ContractorQuote quote = findQuoteOrThrow(quoteId);
		boolean isContractor = quote.getContractor().getId().equals(memberId);
		boolean isLandlord = quote.getRequest().getOwner().getId().equals(memberId);
		if (!isContractor && !isLandlord) {
			throw new ForbiddenAccessException("본인이 작성했거나 본인 의뢰에 달린 견적만 조회할 수 있습니다.");
		}
		return new ContractorQuoteResponse(quote);
	}

	// ⭐ PDF "의뢰 상세" 화면에서 해당 의뢰에 달린 견적(이력) 전체 조회.
	// ⭐ [보안 수정] 임대인은 해당 의뢰에 달린 모든 견적을 볼 수 있지만, 시공사는 본인이 작성한 견적만 보입니다
	// (경쟁 업체 견적 열람 차단).
	public List<ContractorQuoteResponse> getQuotesByRequest(Long requestId, Long memberId) {
		QuoteRequest request = quoteRequestRepository.findById(requestId)
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + requestId));
		List<ContractorQuote> quotes = contractorQuoteRepository.findByRequestId(requestId);
		boolean isLandlord = request.getOwner().getId().equals(memberId);
		if (!isLandlord) {
			quotes = quotes.stream().filter(quote -> quote.getContractor().getId().equals(memberId))
					.collect(Collectors.toList());
		}
		return quotes.stream().map(ContractorQuoteResponse::new).collect(Collectors.toList());
	}

	private void validateContractorOwnership(ContractorQuote quote, Long contractorId) {
		if (!quote.getContractor().getId().equals(contractorId)) {
			throw new ForbiddenAccessException("본인이 작성한 견적만 처리할 수 있습니다.");
		}
	}

	private void validateLandlordOwnership(ContractorQuote quote, Long landlordId) {
		if (!quote.getRequest().getOwner().getId().equals(landlordId)) {
			throw new ForbiddenAccessException("본인이 등록한 의뢰의 견적만 처리할 수 있습니다.");
		}
	}

	private long sumByCategory(List<ContractorQuoteItemRequest> items) {
		return items.stream().mapToLong(ContractorQuoteItemRequest::getAmount).sum();
	}

	private ContractorQuote findQuoteOrThrow(Long quoteId) {
		return contractorQuoteRepository.findById(quoteId)
				.orElseThrow(() -> new QuoteNotFoundException("존재하지 않는 견적입니다: " + quoteId));
	}
}
