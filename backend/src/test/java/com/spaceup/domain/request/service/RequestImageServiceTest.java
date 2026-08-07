package com.spaceup.domain.request.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.request.entity.QuoteRequest;
import com.spaceup.domain.request.entity.RequestImageType;
import com.spaceup.domain.request.entity.RequestStatus;
import com.spaceup.domain.request.repository.QuoteRequestRepository;
import com.spaceup.domain.request.repository.RequestImageRepository;
import com.spaceup.domain.request.repository.RequestContractorRepository;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.RequestNotFoundException;

@ExtendWith(MockitoExtension.class)
class RequestImageServiceTest {

	@Mock
	private RequestImageRepository requestImageRepository;
	@Mock
	private QuoteRequestRepository quoteRequestRepository;
	@Mock
	private RequestContractorRepository requestContractorRepository;

	private RequestImageService service;
	private QuoteRequest request;

	@BeforeEach
	void setUp() {
		service = new RequestImageService(requestImageRepository, quoteRequestRepository, requestContractorRepository);
		Member owner = member(1L, MemberRole.LANDLORD);
		Member contractor = member(2L, MemberRole.CONTRACTOR);
		request = QuoteRequest.builder().id(10L).owner(owner).contractor(contractor).status(RequestStatus.REVIEWING)
				.build();
	}

	@Test
	void ownerCanReadRequestImages() {
		when(quoteRequestRepository.findById(10L)).thenReturn(Optional.of(request));
		when(requestImageRepository.findByRequestIdOrderByImageTypeAscSortOrderAsc(10L)).thenReturn(List.of());

		assertDoesNotThrow(() -> service.getImages(10L, null, 1L));
		verify(requestImageRepository).findByRequestIdOrderByImageTypeAscSortOrderAsc(10L);
	}

	@Test
	void assignedContractorCanReadRequestImages() {
		when(quoteRequestRepository.findById(10L)).thenReturn(Optional.of(request));
		when(requestContractorRepository.existsByRequestIdAndContractorId(10L, 2L)).thenReturn(true);
		when(requestImageRepository.findByRequestIdAndImageTypeOrderBySortOrderAsc(10L, RequestImageType.PHOTO))
				.thenReturn(List.of());

		assertDoesNotThrow(() -> service.getImages(10L, RequestImageType.PHOTO, 2L));
	}

	@Test
	void unrelatedMemberCannotReadRequestImages() {
		when(quoteRequestRepository.findById(10L)).thenReturn(Optional.of(request));

		assertThrows(ForbiddenAccessException.class, () -> service.getImages(10L, null, 99L));
		verify(requestImageRepository, never()).findByRequestIdOrderByImageTypeAscSortOrderAsc(10L);
	}

	@Test
	void missingRequestReturnsNotFoundInsteadOfEmptyList() {
		when(quoteRequestRepository.findById(404L)).thenReturn(Optional.empty());

		assertThrows(RequestNotFoundException.class, () -> service.getImages(404L, null, 1L));
	}

	private Member member(Long id, MemberRole role) {
		return Member.builder().id(id).username("member" + id).password("encoded").email("member" + id + "@test.com")
				.name("테스트 회원").role(role).build();
	}
}
