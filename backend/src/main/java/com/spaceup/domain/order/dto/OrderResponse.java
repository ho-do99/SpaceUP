package com.spaceup.domain.order.dto;

import com.spaceup.domain.order.entity.MaterialOrder;
import com.spaceup.domain.order.entity.OrderStatus;

import lombok.Getter;

@Getter
public class OrderResponse {
	private final Long id;
	private final String orderCode;
	private final Long productId;
	private final String productName;
	private final Long buyerId;
	private final Integer quantity;
	private final Long orderAmount;
	private final boolean paymentCompleted;
	private final OrderStatus status;

	public OrderResponse(MaterialOrder order) {
		this.id = order.getId();
		this.orderCode = order.getOrderCode();
		this.productId = order.getProduct().getId();
		this.productName = order.getProduct().getName();
		this.buyerId = order.getBuyer().getId();
		this.quantity = order.getQuantity();
		this.orderAmount = order.getOrderAmount();
		this.paymentCompleted = order.isPaymentCompleted();
		this.status = order.getStatus();
	}
}
