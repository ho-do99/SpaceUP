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

	Page<MaterialOrder> findByStatus(OrderStatus status, Pageable pageable);
}
