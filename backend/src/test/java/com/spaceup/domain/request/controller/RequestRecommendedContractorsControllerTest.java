package com.spaceup.domain.request.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.spaceup.domain.analysis.service.AnalysisJobService;
import com.spaceup.domain.matching.dto.RecommendedContractorResponse;
import com.spaceup.domain.matching.service.ContractorRecommendationService;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.domain.member.service.CustomUserDetailsService;
import com.spaceup.domain.request.service.RequestService;
import com.spaceup.global.config.SecurityConfig;
import com.spaceup.global.error.ForbiddenAccessException;
import com.spaceup.global.error.GlobalExceptionHandler;
import com.spaceup.global.error.RequestNotFoundException;
import com.spaceup.global.security.JwtAuthenticationFilter;
import com.spaceup.global.security.JwtTokenProvider;

@WebMvcTest(RequestController.class)
@Import({
		SecurityConfig.class,
		JwtAuthenticationFilter.class,
		GlobalExceptionHandler.class
})
class RequestRecommendedContractorsControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private RequestService requestService;
	@MockitoBean
	private AnalysisJobService analysisJobService;
	@MockitoBean
	private ContractorRecommendationService contractorRecommendationService;
	@MockitoBean
	private JwtTokenProvider jwtTokenProvider;
	@MockitoBean
	private CustomUserDetailsService customUserDetailsService;

	@Test
	void ownerReceivesRankedRecommendationsWithScoreBreakdown() throws Exception {
		RecommendedContractorResponse response = new RecommendedContractorResponse(2L, "공간디자인 인테리어", 4.8, 128,
				50_000_000L, 80_000_000L, LocalDate.of(2026, 6, 5), new BigDecimal("38.72"), 35, 25,
				new BigDecimal("98.72"), 1);
		when(contractorRecommendationService.recommend(eq(1L), eq(100L))).thenReturn(List.of(response));

		mockMvc.perform(get("/api/requests/1/recommended-contractors").with(user(principal(100L))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data[0].contractorId").value(2))
				.andExpect(jsonPath("$.data[0].reviewScore").value(38.72))
				.andExpect(jsonPath("$.data[0].priceScore").value(35))
				.andExpect(jsonPath("$.data[0].scheduleScore").value(25))
				.andExpect(jsonPath("$.data[0].matchScore").value(98.72))
				.andExpect(jsonPath("$.data[0].recommendationRank").value(1));
	}

	@Test
	void nonOwnerReceivesForbidden() throws Exception {
		when(contractorRecommendationService.recommend(eq(1L), eq(999L)))
				.thenThrow(new ForbiddenAccessException("본인이 등록한 의뢰만 추천 시공사를 조회할 수 있습니다."));

		mockMvc.perform(get("/api/requests/1/recommended-contractors").with(user(principal(999L))))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	void nonexistentRequestReturnsNotFound() throws Exception {
		when(contractorRecommendationService.recommend(eq(404L), eq(100L)))
				.thenThrow(new RequestNotFoundException("존재하지 않는 의뢰입니다: 404"));

		mockMvc.perform(get("/api/requests/404/recommended-contractors").with(user(principal(100L))))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.success").value(false));
	}

	// ⭐ RequestController.getMemberId()가 Authentication.getPrincipal()을 MemberPrincipal로 캐스팅하므로,
	// Spring Security Test 기본 user()가 만드는 org.springframework.security.core.userdetails.User로는
	// ClassCastException이 납니다. 실제 로그인 흐름과 동일한 MemberPrincipal을 직접 만들어 넣어줍니다.
	private MemberPrincipal principal(Long memberId) {
		Member member = Member.builder().id(memberId).username("member" + memberId).password("encoded")
				.email("member" + memberId + "@test.com").name("테스트회원").role(MemberRole.LANDLORD).build();
		return new MemberPrincipal(member);
	}
}
