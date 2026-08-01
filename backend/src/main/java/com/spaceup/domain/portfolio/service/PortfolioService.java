package com.spaceup.domain.portfolio.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.repository.MemberRepository;
import com.spaceup.domain.portfolio.dto.PortfolioCreateRequest;
import com.spaceup.domain.portfolio.dto.PortfolioResponse;
import com.spaceup.domain.portfolio.entity.Portfolio;
import com.spaceup.domain.portfolio.repository.PortfolioRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.MemberNotFoundException;
import com.spaceup.global.error.PortfolioNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PortfolioService {

	private final PortfolioRepository portfolioRepository;
	private final MemberRepository memberRepository;

	// ⭐ PDF "포트폴리오 등록" 화면
	@Transactional
	public Long create(Long contractorId, PortfolioCreateRequest dto) {
		Member contractor = memberRepository.findById(contractorId)
				.orElseThrow(() -> new MemberNotFoundException("존재하지 않는 회원 번호입니다: " + contractorId));

		Portfolio portfolio = Portfolio.builder().contractor(contractor).projectName(dto.getProjectName())
				.region(dto.getRegion()).propertyType(dto.getPropertyType()).areaM2(dto.getAreaM2())
				.workItems(dto.getWorkItems()).durationDays(dto.getDurationDays()).amount(dto.getAmount())
				.mainImageUrl(dto.getMainImageUrl()).photoUrls(dto.getPhotoUrls()).build();

		portfolioRepository.save(portfolio);
		return portfolio.getId();
	}

	// ⭐ PDF "포트폴리오" 목록 화면 - 본인 전체 목록 (공개/비공개 구분은 응답의 isPublic으로 프론트에서 필터)
	public List<PortfolioResponse> getMyPortfolios(Long contractorId) {
		return portfolioRepository.findByContractorId(contractorId).stream().map(PortfolioResponse::new)
				.collect(Collectors.toList());
	}

	public PortfolioResponse getPortfolio(Long portfolioId) {
		return new PortfolioResponse(findOrThrow(portfolioId));
	}

	// ⭐ [프론트 연동] "시공사 상세" 화면 - 다른 사용자가 해당 시공사의 공개 포트폴리오만 조회
	public List<PortfolioResponse> getPublicPortfolios(Long contractorId) {
		return portfolioRepository.findByContractorIdAndIsPublic(contractorId, true).stream()
				.map(PortfolioResponse::new).collect(Collectors.toList());
	}

	// ⭐ PDF "포트폴리오 수정" 화면 - 본인 소유만 가능
	@Transactional
	public void update(Long portfolioId, Long contractorId, PortfolioCreateRequest dto) {
		Portfolio portfolio = findOrThrow(portfolioId);
		validateOwnership(portfolio, contractorId);
		portfolio.update(dto.getProjectName(), dto.getRegion(), dto.getPropertyType(), dto.getAreaM2(),
				dto.getWorkItems(), dto.getDurationDays(), dto.getAmount(), dto.getMainImageUrl(),
				dto.getPhotoUrls());
	}

	// ⭐ PDF "포트폴리오 관리" 화면의 "삭제" 버튼 - 본인 소유만 가능
	@Transactional
	public void delete(Long portfolioId, Long contractorId) {
		Portfolio portfolio = findOrThrow(portfolioId);
		validateOwnership(portfolio, contractorId);
		portfolioRepository.delete(portfolio);
	}

	// ⭐ PDF "업체 공개 설정 - 포트폴리오 공개" 토글과 별개로, 건별 공개/비공개 전환도 지원합니다.
	@Transactional
	public void changeVisibility(Long portfolioId, Long contractorId, boolean isPublic) {
		Portfolio portfolio = findOrThrow(portfolioId);
		validateOwnership(portfolio, contractorId);
		portfolio.changeVisibility(isPublic);
	}

	private void validateOwnership(Portfolio portfolio, Long contractorId) {
		if (!portfolio.getContractor().getId().equals(contractorId)) {
			throw new ForbiddenAccessException("본인이 등록한 포트폴리오만 처리할 수 있습니다.");
		}
	}

	private Portfolio findOrThrow(Long portfolioId) {
		return portfolioRepository.findById(portfolioId)
				.orElseThrow(() -> new PortfolioNotFoundException("존재하지 않는 포트폴리오입니다: " + portfolioId));
	}
}
