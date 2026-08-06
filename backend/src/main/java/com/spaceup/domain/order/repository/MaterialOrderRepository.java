package com.spaceup.domain.order.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.order.entity.MaterialOrder;
import com.spaceup.domain.order.entity.OrderStatus;

@Repository
public interface MaterialOrderRepository extends JpaRepository<MaterialOrder, Long> {

	Page<MaterialOrder> findByBuyerId(Long buyerId, Pageable pageable);

	// ⭐ [보안 수정] 자재업체가 자신이 등록한 상품에 대한 주문만 상태별로 조회할 수 있도록 vendorId로 스코프
	Page<MaterialOrder> findByStatusAndProductVendorId(OrderStatus status, Long vendorId, Pageable pageable);
}
