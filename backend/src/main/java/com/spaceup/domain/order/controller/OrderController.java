package com.spaceup.domain.order.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.spaceup.domain.member.security.MemberPrincipal;
import com.spaceup.domain.order.dto.OrderCreateRequest;
import com.spaceup.domain.order.dto.OrderResponse;
import com.spaceup.domain.order.entity.OrderStatus;
import com.spaceup.domain.order.service.OrderService;
import com.spaceup.global.util.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

	private final OrderService orderService;

	// ⭐ PDF "주문/발주 관리" - 시공사가 자재를 주문 (시공사 로그인 기준)
	@PostMapping
	public ResponseEntity<ApiResponse<Long>> createOrder(@Valid @RequestBody OrderCreateRequest request,
			Authentication authentication) {
		Long buyerId = getMemberId(authentication);
		Long orderId = orderService.createOrder(buyerId, request);
		return ResponseEntity.ok(ApiResponse.success("주문이 접수되었습니다.", orderId));
	}

	@GetMapping("/{orderId}")
	public ResponseEntity<ApiResponse<OrderResponse>> getOrder(@PathVariable Long orderId) {
		return ResponseEntity.ok(ApiResponse.success("주문 조회 완료", orderService.getOrder(orderId)));
	}

	// ⭐ PDF "주문/발주 관리" 목록 (시공사 로그인 기준 - 본인 주문 내역, 페이지네이션)
	@GetMapping("/buyer/me")
	public ResponseEntity<ApiResponse<Page<OrderResponse>>> getMyOrders(@PageableDefault(size = 20) Pageable pageable,
			Authentication authentication) {
		Long buyerId = getMemberId(authentication);
		return ResponseEntity.ok(ApiResponse.success("주문 목록 조회 완료", orderService.getOrdersByBuyer(buyerId, pageable)));
	}

	// ⭐ PDF "주문/발주 관리" 파이프라인별 목록 (자재업체 로그인 기준, 페이지네이션)
	@GetMapping("/status/{status}")
	public ResponseEntity<ApiResponse<Page<OrderResponse>>> getOrdersByStatus(@PathVariable OrderStatus status,
			@PageableDefault(size = 20) Pageable pageable) {
		return ResponseEntity.ok(ApiResponse.success("주문 목록 조회 완료", orderService.getOrdersByStatus(status, pageable)));
	}

	// ⭐ PDF 파이프라인 단계 전환 버튼들 (해당 상품을 등록한 자재업체 본인만)
	@PostMapping("/{orderId}/ready")
	public ResponseEntity<ApiResponse<Void>> markReady(@PathVariable Long orderId, Authentication authentication) {
		orderService.markReady(orderId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("출고 준비 상태로 변경되었습니다.", null));
	}

	@PostMapping("/{orderId}/ship")
	public ResponseEntity<ApiResponse<Void>> markShipped(@PathVariable Long orderId, Authentication authentication) {
		orderService.markShipped(orderId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("배송 중 상태로 변경되었습니다.", null));
	}

	@PostMapping("/{orderId}/complete")
	public ResponseEntity<ApiResponse<Void>> complete(@PathVariable Long orderId, Authentication authentication) {
		orderService.complete(orderId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("주문이 완료 처리되었습니다.", null));
	}

	// ⭐ 결제 완료 처리 - 주문한 시공사(구매자) 본인만
	@PostMapping("/{orderId}/payment")
	public ResponseEntity<ApiResponse<Void>> completePayment(@PathVariable Long orderId,
			Authentication authentication) {
		orderService.completePayment(orderId, getMemberId(authentication));
		return ResponseEntity.ok(ApiResponse.success("결제가 완료 처리되었습니다.", null));
	}

	private Long getMemberId(Authentication authentication) {
		MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
		return principal.getId();
	}
}
