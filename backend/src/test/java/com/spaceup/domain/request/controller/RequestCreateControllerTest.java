package com.spaceup.domain.request.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.spaceup.domain.analysis.service.AnalysisJobService;
import com.spaceup.domain.matching.service.ContractorRecommendationService;
import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberRole;
import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.domain.member.service.CustomUserDetailsService;
import com.spaceup.domain.request.dto.RequestCreateRequest;
import com.spaceup.domain.request.service.RequestImageService;
import com.spaceup.domain.request.service.RequestService;
import com.spaceup.global.config.SecurityConfig;
import com.spaceup.global.error.GlobalExceptionHandler;
import com.spaceup.global.security.JwtAuthenticationFilter;
import com.spaceup.global.security.JwtTokenProvider;

@WebMvcTest(RequestController.class)
@Import({ SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class })
class RequestCreateControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private RequestService requestService;
	@MockitoBean
	private AnalysisJobService analysisJobService;
	@MockitoBean
	private ContractorRecommendationService contractorRecommendationService;
	@MockitoBean
	private RequestImageService requestImageService;
	@MockitoBean
	private JwtTokenProvider jwtTokenProvider;
	@MockitoBean
	private CustomUserDetailsService customUserDetailsService;

	@Test
	void creatingARequestDoesNotStartAnalysisBeforeAFloorPlanIsReady() throws Exception {
		when(requestService.createRequest(eq(100L), any(RequestCreateRequest.class))).thenReturn(77L);

		mockMvc.perform(post("/api/requests").with(user(principal(100L)))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "region": "광주광역시 서구 상무중앙로 100",
						  "propertyType": "APARTMENT",
						  "areaM2": 84.0
						}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data").value(77));

		verifyNoInteractions(analysisJobService);
	}

	private MemberPrincipal principal(Long memberId) {
		Member member = Member.builder().id(memberId).password("encoded")
				.email("member" + memberId + "@test.com").name("테스트회원").role(MemberRole.LANDLORD).build();
		return new MemberPrincipal(member);
	}
}
