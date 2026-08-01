package com.spaceup.domain.notification.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.notification.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

	Page<Notification> findByReceiverIdOrderByCreatedAtDesc(Long receiverId, Pageable pageable);

	// ⭐ "모두 읽음" 처리는 페이지네이션 없이 전체가 필요해서 List 버전을 따로 둡니다.
	java.util.List<Notification> findByReceiverIdAndReadFalse(Long receiverId);
}
