package com.spaceup.domain.matching.service;

import com.spaceup.domain.contractor.entity.ContractorProfile;
import com.spaceup.domain.matching.dto.MatchingScoreResult;
import com.spaceup.domain.request.entity.QuoteRequest;

/**
 * ⭐ PDF 전반에 등장하는 "매칭 점수 92점", "매칭률 88%" 를 계산하는 확장 지점입니다. 규칙 기반으로 갈지, 외부 AI 서버
 * 호출로 갈지 정해지면 구현체를 하나 만들어 @Service로 등록하세요. (예: RuleBasedMatchingScoreCalculator,
 * AiMatchingScoreCalculator) RequestService.assignContractor() 호출 전후로 붙이면 됩니다.
 *
 * ⭐ [시공사 추천 점수 고도화] 이전엔 contractorId만 받아 구현체가 직접 Repository를 조회했지만(추천 후보 N명마다
 * 매번 재조회하는 N+1 원인), 순수 계산기로 바꿔 ContractorProfile을 호출자가 미리 조회해서 넘기도록 했습니다.
 */
public interface MatchingScoreCalculator {

	MatchingScoreResult calculate(QuoteRequest request, ContractorProfile profile);
}
