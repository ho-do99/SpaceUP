package com.spaceup.domain.analysis.service;

import org.springframework.stereotype.Component;

/**
 * ⭐ [고도화] 인테리어 투자액이 전세/월세 가치에 미치는 영향을 계산합니다. (기존 "전세반영률+월세반영률+전환율" 3중 계산
 * 방식을 "반영률 1개(전세 기준) + 전월세전환율로 월세 환산"으로 단순화하고, 체감효과·상하한선을 추가했습니다.)
 *
 * 계산 순서: (1) 인테리어비용이 현재 시세 대비 과도하면 초과분은 절반만 반영(체감효과) → (2) 그 유효비용에 반영률
 * min/max를 곱해 전세가치 상승분 산출 → (3) 전월세전환율로 나눠 월세 상승분 환산 → (4) 상한(주변 상위가, 있으면)/하한
 * (현재가 이하로 안 내려감)으로 클램프.
 *
 * 아래 상수들은 전부 임시값입니다 - 실제 임대 계약 결과가 쌓이면 조정하세요.
 */
@Component
public class RentalValueCalculator {

	private static final double REFLECTION_RATE_MIN = 0.24; // 반영률 하한 (base 30% - 20%)
	private static final double REFLECTION_RATE_MAX = 0.36; // 반영률 상한 (base 30% + 20%)
	private static final double CONVERSION_RATE_ANNUAL = 0.05; // 전월세전환율 연 5% (지역 무관 임시 고정값)
	private static final double DAMPENING_THRESHOLD_RATIO = 0.15; // 인테리어비용/현재시세 비율이 이 값까진 그대로 반영
	private static final double DAMPENING_EXCESS_FACTOR = 0.5; // 임계값 초과분은 이 비율만큼만 반영(한계효용 체감)

	/**
	 * @param currentDeposit      현재 전세 시세(원). null/0 이하면 계산 불가로 null 반환
	 * @param currentMonthlyRent  현재 월세(원). null이면 월세 관련 결과는 null로 반환(전세만 계산)
	 * @param interiorCost        인테리어비용(원). null/0 이하면 계산 불가로 null 반환
	 * @param comparableDepositCap 주변 상위 전세가격(원). 아직 실거래가 API 연동 전이라 없으면 null(상한 미적용)
	 * @param comparableRentCap   주변 상위 월세가격(원). 없으면 null(상한 미적용)
	 */
	public Result calculate(Long currentDeposit, Long currentMonthlyRent, Long interiorCost, Long comparableDepositCap,
			Long comparableRentCap) {
		if (currentDeposit == null || currentDeposit <= 0 || interiorCost == null || interiorCost <= 0) {
			return null;
		}

		long effectiveCost = applyDampening(interiorCost, currentDeposit);

		long depositIncreaseMin = Math.round(effectiveCost * REFLECTION_RATE_MIN);
		long depositIncreaseMax = Math.round(effectiveCost * REFLECTION_RATE_MAX);

		long depositEstimateMin = clamp(currentDeposit + depositIncreaseMin, currentDeposit, comparableDepositCap);
		long depositEstimateMax = clamp(currentDeposit + depositIncreaseMax, currentDeposit, comparableDepositCap);

		Long rentIncreaseMin = null;
		Long rentIncreaseMax = null;
		if (currentMonthlyRent != null) {
			// ⭐ 클램프로 줄어든 실제 전세 상승분을 기준으로 월세를 환산해야 상/하한이 반영된 값끼리 일관됩니다.
			long clampedDepositIncreaseMin = depositEstimateMin - currentDeposit;
			long clampedDepositIncreaseMax = depositEstimateMax - currentDeposit;
			long rawRentIncreaseMin = Math.round(clampedDepositIncreaseMin * CONVERSION_RATE_ANNUAL / 12);
			long rawRentIncreaseMax = Math.round(clampedDepositIncreaseMax * CONVERSION_RATE_ANNUAL / 12);

			long rentEstimateMin = clamp(currentMonthlyRent + rawRentIncreaseMin, currentMonthlyRent,
					comparableRentCap);
			long rentEstimateMax = clamp(currentMonthlyRent + rawRentIncreaseMax, currentMonthlyRent,
					comparableRentCap);
			rentIncreaseMin = rentEstimateMin - currentMonthlyRent;
			rentIncreaseMax = rentEstimateMax - currentMonthlyRent;
		}

		return new Result(depositEstimateMin - currentDeposit, depositEstimateMax - currentDeposit, rentIncreaseMin,
				rentIncreaseMax);
	}

	private long applyDampening(long interiorCost, long currentPrice) {
		long threshold = Math.round(currentPrice * DAMPENING_THRESHOLD_RATIO);
		if (interiorCost <= threshold) {
			return interiorCost;
		}
		long excess = interiorCost - threshold;
		return threshold + Math.round(excess * DAMPENING_EXCESS_FACTOR);
	}

	private long clamp(long value, long floor, Long cap) {
		long result = Math.max(value, floor);
		return cap != null ? Math.min(result, cap) : result;
	}

	public record Result(long depositIncreaseMin, long depositIncreaseMax, Long rentIncreaseMin, Long rentIncreaseMax) {
	}
}
