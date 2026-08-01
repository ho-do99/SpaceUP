package com.spaceup.domain.member.dto;

import java.time.LocalDateTime;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.domain.member.entity.MemberApprovalStatus;
import com.spaceup.domain.member.entity.MemberRole;

import lombok.Getter;

@Getter
public class MemberResponse {
	private final Long id;
	private final String username;
	private final String email;
	private final String name;
	private final String phoneNumber;
	private final boolean phoneVerified;
	private final MemberRole role;
	private final MemberApprovalStatus approvalStatus;
	private final String applicationNumber;
	private final String approvalNumber;
	private final String revisionMessage;
	private final LocalDateTime revisionDeadline;
	private final LocalDateTime createdAt;

	public MemberResponse(Member member) {
		this.id = member.getId();
		this.username = member.getUsername();
		this.email = member.getEmail();
		this.name = member.getName();
		this.phoneNumber = member.getPhoneNumber();
		this.phoneVerified = member.isPhoneVerified();
		this.role = member.getRole();
		this.approvalStatus = member.getApprovalStatus();
		this.applicationNumber = member.getApplicationNumber();
		this.approvalNumber = member.getApprovalNumber();
		this.revisionMessage = member.getRevisionMessage();
		this.revisionDeadline = member.getRevisionDeadline();
		this.createdAt = member.getCreatedAt();
	}
}
