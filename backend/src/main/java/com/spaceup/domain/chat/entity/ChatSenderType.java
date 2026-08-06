package com.spaceup.domain.chat.entity;

// ⭐ [프론트 연동] 프론트 ContractorChatSender('customer'|'contractor'|'system')와 1:1 대응.
// LANDLORD=customer, CONTRACTOR=contractor, SYSTEM=system(방문 확정 등 시스템 안내 메시지)
public enum ChatSenderType {
	LANDLORD, CONTRACTOR, SYSTEM
}
