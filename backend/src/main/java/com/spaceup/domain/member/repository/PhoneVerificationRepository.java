package com.spaceup.domain.member.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.member.entity.PhoneVerification;

@Repository
public interface PhoneVerificationRepository extends JpaRepository<PhoneVerification, Long> {

	Optional<PhoneVerification> findTopByPhoneNumberOrderByIdDesc(String phoneNumber);
}
