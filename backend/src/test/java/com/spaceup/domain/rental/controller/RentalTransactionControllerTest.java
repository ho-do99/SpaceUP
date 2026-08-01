package com.spaceup.domain.rental.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.YearMonth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.spaceup.domain.member.service.CustomUserDetailsService;
import com.spaceup.domain.rental.dto.RentalSyncResponse;
import com.spaceup.domain.rental.entity.RentalSyncStatus;
import com.spaceup.domain.rental.exception.RentalApiConfigurationException;
import com.spaceup.domain.rental.exception.RentalApiException;
import com.spaceup.domain.rental.service.RentalQueryService;
import com.spaceup.domain.rental.service.RentalSyncService;
import com.spaceup.global.config.SecurityConfig;
import com.spaceup.global.error.GlobalExceptionHandler;
import com.spaceup.global.security.JwtAuthenticationFilter;
import com.spaceup.global.security.JwtTokenProvider;

@WebMvcTest(RentalTransactionController.class)
@Import({
		SecurityConfig.class,
		JwtAuthenticationFilter.class,
		GlobalExceptionHandler.class
})
class RentalTransactionControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private RentalSyncService syncService;
	@MockitoBean
	private RentalQueryService queryService;
	@MockitoBean
	private JwtTokenProvider jwtTokenProvider;
	@MockitoBean
	private CustomUserDetailsService customUserDetailsService;

	@Test
	void allowsAdminToStartSynchronization() throws Exception {
		when(syncService.sync("11110", YearMonth.of(2026, 7)))
				.thenReturn(new RentalSyncResponse(
						42L, "11110", "202607", 3, 3, 2, 1, 0,
						RentalSyncStatus.SUCCESS));

		mockMvc.perform(post("/api/rental-transactions/sync")
						.with(user("admin").roles("ADMIN"))
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"lawdCd":"11110","dealYm":"202607"}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.insertedCount").value(2))
				.andExpect(jsonPath("$.data.duplicateCount").value(1));
	}

	@Test
	void deniesSynchronizationToNonAdmin() throws Exception {
		mockMvc.perform(post("/api/rental-transactions/sync")
						.with(user("member").roles("LANDLORD"))
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"lawdCd":"11110","dealYm":"202607"}
								"""))
				.andExpect(status().isForbidden());
	}

	@Test
	void rejectsInvalidRegionCode() throws Exception {
		mockMvc.perform(post("/api/rental-transactions/sync")
						.with(user("admin").roles("ADMIN"))
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"lawdCd":"1111","dealYm":"202607"}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	void rejectsNonexistentContractMonth() throws Exception {
		mockMvc.perform(post("/api/rental-transactions/sync")
						.with(user("admin").roles("ADMIN"))
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"lawdCd":"11110","dealYm":"202613"}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.success").value(false));
	}

	@Test
	void returnsBadGatewayForExternalApiFailure() throws Exception {
		when(syncService.sync("11110", YearMonth.of(2026, 7)))
				.thenThrow(new RentalApiException("외부 API 호출 실패"));

		mockMvc.perform(post("/api/rental-transactions/sync")
						.with(user("admin").roles("ADMIN"))
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"lawdCd":"11110","dealYm":"202607"}
								"""))
				.andExpect(status().isBadGateway())
				.andExpect(jsonPath("$.success").value(false))
				.andExpect(jsonPath("$.message").value("외부 API 호출 실패"));
	}

	@Test
	void returnsServiceUnavailableForMissingApiKey() throws Exception {
		when(syncService.sync("11110", YearMonth.of(2026, 7)))
				.thenThrow(new RentalApiConfigurationException("키 미설정"));

		mockMvc.perform(post("/api/rental-transactions/sync")
						.with(user("admin").roles("ADMIN"))
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"lawdCd":"11110","dealYm":"202607"}
								"""))
				.andExpect(status().isServiceUnavailable())
				.andExpect(jsonPath("$.success").value(false))
				.andExpect(jsonPath("$.message").value("키 미설정"));
	}

	@Test
	void queriesStoredTransactionsWithParsedMonthAndPage() throws Exception {
		when(queryService.find(eq("11110"), eq(YearMonth.of(2026, 7)), any(Pageable.class)))
				.thenReturn(Page.empty());

		mockMvc.perform(get("/api/rental-transactions")
						.with(user("member").roles("LANDLORD"))
						.param("lawdCd", "11110")
						.param("dealYm", "202607")
						.param("page", "0")
						.param("size", "20"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.success").value(true))
				.andExpect(jsonPath("$.data.totalElements").value(0));

		verify(queryService).find(
				eq("11110"), eq(YearMonth.of(2026, 7)), any(Pageable.class));
	}
}
