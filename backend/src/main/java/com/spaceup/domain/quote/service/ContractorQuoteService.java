package com.spaceup.domain.quote.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.notification.entity.NotificationType;
import com.spaceup.domain.notification.service.NotificationService;
import com.spaceup.domain.quote.dto.ContractorQuoteCreateRequest;
import com.spaceup.domain.quote.dto.ContractorQuoteItemRequest;
import com.spaceup.domain.quote.dto.ContractorQuoteResponse;
import com.spaceup.domain.quote.entity.ContractorQuote;
import com.spaceup.domain.quote.entity.ContractorQuoteItem;
import com.spaceup.domain.quote.entity.QuotePhase;
import com.spaceup.domain.quote.entity.QuoteStatus;
import com.spaceup.domain.quote.repository.ContractorQuoteRepository;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestContractor;
import com.spaceup.domain.request.entity.RequestContractorStatus;
import com.spaceup.domain.request.repository.RequestContractorRepository;
import com.spaceup.domain.visit.entity.SiteVisitStatus;
import com.spaceup.domain.visit.repository.SiteVisitRepository;
import com.spaceup.domain.visit.service.SiteVisitService;
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
	private final RequestContractorRepository requestContractorRepository;
	private final QuoteRequestRepository quoteRequestRepository;
	private final MemberRepository memberRepository;
	private final NotificationService notificationService;
	private final SiteVisitService siteVisitService;
	private final SiteVisitRepository siteVisitRepository;

	// ⭐ PDF "임시 저장" 버튼 → DRAFT 상태로 생성. 항목 금액 합계 + 부가세 - 할인 = 최종 견적으로 자동 계산합니다.
	@Transactional
	public Long createDraft(Long contractorId, ContractorQuoteCreateRequest dto) {
		QuoteRequest request = quoteRequestRepository.findById(dto.getRequestId())
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + dto.getRequestId()));
		RequestContractor participation = requestContractorRepository
				.findByRequestIdAndContractorId(request.getId(), contractorId)
				.orElseThrow(() -> new ForbiddenAccessException("견적 참여를 요청받은 의뢰에만 견적을 작성할 수 있습니다."));
		QuotePhase phase = resolveQuotePhase(participation);
		Member contractor = memberRepository.findById(contractorId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 시공사입니다: " + contractorId));

		long materialCost = sumByCategory(dto.getItems());

		ContractorQuote quote = ContractorQuote.builder().request(request).contractor(contractor)
				.title(dto.getTitle()).startDate(dto.getStartDate()).durationDays(dto.getDurationDays())
				.materialCost(dto.getMaterialCost() != null ? dto.getMaterialCost() : materialCost)
				.laborCost(dto.getLaborCost()).vat(dto.getVat()).discount(dto.getDiscount())
				.detailContent(dto.getDetailContent()).status(QuoteStatus.DRAFT).phase(phase).build();

		dto.getItems().forEach(itemDto -> quote.addItem(ContractorQuoteItem.builder()
				.category(itemDto.getCategory()).description(itemDto.getDescription()).amount(itemDto.getAmount())
				.build()));

		quote.recalculateTotal();
		contractorQuoteRepository.save(quote);
		return quote.getId();
	}

	@Transactional
	public void updateDraft(Long quoteId, Long contractorId, ContractorQuoteCreateRequest dto) {
		ContractorQuote quote = findQuoteOrThrow(quoteId);
		validateContractorOwnership(quote, contractorId);
		if (!quote.getRequest().getId().equals(dto.getRequestId())) {
			throw new InvalidStatusTransitionException("견적이 속한 의뢰 번호는 변경할 수 없습니다.");
		}
		long itemTotal = sumByCategory(dto.getItems());
		List<ContractorQuoteItem> items = dto.getItems().stream()
				.map(item -> ContractorQuoteItem.builder().category(item.getCategory())
						.description(item.getDescription()).amount(item.getAmount()).build())
				.toList();
		quote.updateDraft(dto.getTitle(), dto.getStartDate(), dto.getDurationDays(),
				dto.getMaterialCost() != null ? dto.getMaterialCost() : itemTotal,
				dto.getLaborCost(), dto.getVat(), dto.getDiscount(), dto.getDetailContent(), items);
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
		quoteRequestRepository.findByIdForUpdate(quote.getRequest().getId())
				.orElseThrow(() -> new RequestNotFoundException("존재하지 않는 의뢰입니다: " + quote.getRequest().getId()));
		contractorQuoteRepository.findFirstByRequestIdAndPhaseAndStatusOrderByUpdatedAtDesc(
				quote.getRequest().getId(), quote.getPhase(), QuoteStatus.ACCEPTED).ifPresent(existing -> {
					throw new InvalidStatusTransitionException("이미 이 단계에서 수락된 견적이 있습니다.");
				});
		quote.accept();

		if (quote.getPhase() == QuotePhase.PRELIMINARY) {
			RequestContractor selected = requestContractorRepository
					.findByRequestIdAndContractorId(quote.getRequest().getId(), quote.getContractor().getId())
					.orElseThrow(() -> new InvalidStatusTransitionException("견적 참여 정보가 없어 시공사를 확정할 수 없습니다."));
			selected.select();
			requestContractorRepository.findByRequestId(quote.getRequest().getId()).stream()
					.filter(participation -> !participation.getId().equals(selected.getId()))
					.forEach(RequestContractor::close);
			quote.getRequest().selectContractor(quote.getContractor());
			siteVisitService.createIfAbsent(quote.getRequest(), quote.getContractor());

			notificationService.notify(quote.getContractor().getId(), NotificationType.QUOTE, "1차 예상 견적이 선택되었습니다",
					String.format("%s 1차 예상 견적이 선택되었습니다. 실측 방문 일정을 등록해 주세요.", quote.getTitle()));
			return;
		}

		notificationService.notify(quote.getContractor().getId(), NotificationType.QUOTE, "최종 견적이 확정되었습니다",
				String.format("%s 최종 견적이 확정되었습니다.", quote.getTitle()));
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
	public void requestRevision(Long quoteId, Long landlordId, String note, List<Long> targetItemIds,
			Long requestedAmount) {
		ContractorQuote quote = findQuoteOrThrow(quoteId);
		validateLandlordOwnership(quote, landlordId);
		String joinedItemIds = targetItemIds == null || targetItemIds.isEmpty() ? null
				: targetItemIds.stream().map(String::valueOf).collect(Collectors.joining(","));
		quote.requestRevision(note, joinedItemIds, requestedAmount);

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

	private QuotePhase resolveQuotePhase(RequestContractor participation) {
		if (participation.getStatus() == RequestContractorStatus.APPROVED) {
			return QuotePhase.PRELIMINARY;
		}
		if (participation.getStatus() == RequestContractorStatus.SELECTED) {
			boolean visitCompleted = siteVisitRepository.findByRequestIdAndContractorId(
					participation.getRequest().getId(), participation.getContractor().getId())
					.map(visit -> visit.getStatus() == SiteVisitStatus.COMPLETED).orElse(false);
			if (!visitCompleted) {
				throw new InvalidStatusTransitionException("실측 방문 완료 후 최종 견적을 작성할 수 있습니다.");
			}
			return QuotePhase.FINAL;
		}
		throw new InvalidStatusTransitionException("참여를 승인한 시공사만 1차 예상 견적을 작성할 수 있습니다.");
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
