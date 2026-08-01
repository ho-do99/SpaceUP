package com.spaceup.domain.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.product.entity.Product;
import com.spaceup.global.entity.BaseTimeEntity;
import com.spaceup.global.error.InvalidStatusTransitionException;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ PDF "주문/발주 관리" 화면. buyer는 시공사(자재를 구매하는 쪽), 상품은 자재업체가 등록한 Product.
@Entity
@Table(name = "material_orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class MaterialOrder extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "order_code", unique = true, length = 30)
	private String orderCode; // 예: ORD-250714-001

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "product_id", nullable = false)
	private Product product;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "buyer_id", nullable = false)
	private Member buyer; // 주문한 시공사

	@Column(nullable = false)
	private Integer quantity;

	@Column(name = "order_amount")
	private Long orderAmount;

	@Column(name = "payment_completed")
	private boolean paymentCompleted;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private OrderStatus status;

	// ⭐ [최종 검토 반영] 기존에는 상태와 무관하게 무조건 전이가 성공해서, 완료된 주문을 다시
	// 출고준비로 되돌리는 것도 가능했습니다. Request.validateTransitionable()과 같은 패턴으로 가드를 추가합니다.
	public void markReady() {
		validateStatus(OrderStatus.NEW);
		this.status = OrderStatus.READY_TO_SHIP;
	}

	public void markShipped() {
		validateStatus(OrderStatus.READY_TO_SHIP);
		this.status = OrderStatus.SHIPPING;
	}

	public void complete() {
		validateStatus(OrderStatus.SHIPPING);
		this.status = OrderStatus.COMPLETED;
	}

	public void completePayment() {
		if (this.paymentCompleted) {
			throw new InvalidStatusTransitionException("이미 결제가 완료된 주문입니다.");
		}
		this.paymentCompleted = true;
	}

	private void validateStatus(OrderStatus expected) {
		if (this.status != expected) {
			throw new InvalidStatusTransitionException(
					String.format("현재 상태(%s)에서는 처리할 수 없습니다. 예상 상태: %s", this.status, expected));
		}
	}

	// ⭐ DB가 부여한 auto-increment id를 이용해 코드를 나중에 붙일 때 사용 (OrderService 참고)
	public void assignCode(String orderCode) {
		this.orderCode = orderCode;
	}
}
