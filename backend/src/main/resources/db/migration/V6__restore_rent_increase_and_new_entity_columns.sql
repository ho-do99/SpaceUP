-- 세션 중 엔티티에는 반영됐지만 실DB에는 반영되지 않은 컬럼을 catch-up.
--
-- 1) 실DB의 flyway_schema_history에는 V5(remove rental value columns, 2026-08-11 적용)가
--    기록돼 있지만, 이 저장소에는 그 V5 파일이 없다(커밋 이력에도 없음). 실제 컬럼 구조를
--    조회해보니 삭제 대상이 아니었던 analysis_job.expected_rent_increase_min/max까지 함께
--    삭제된 상태였다 - 커밋 dfaa18b의 의도("ROI 요약(ML 콜백 기반 expectedRentIncrease 등)은
--    핵심 기능이라 그대로 유지")와 어긋나므로 두 컬럼을 복원한다.
-- 2) 이번 세션에서 엔티티에 추가된 시공사 가입 필드 / 견적 수정요청 구조화 필드 /
--    이메일 인증 필드를 반영한다.
-- 3) username은 로그인 식별자가 email로 전환되며 더 이상 엔티티가 값을 채우지 않으므로,
--    기존 데이터 보존을 위해 컬럼/유니크 제약은 남기고 NOT NULL만 해제한다.
ALTER TABLE `analysis_job`
  ADD COLUMN `expected_rent_increase_min` bigint DEFAULT NULL,
  ADD COLUMN `expected_rent_increase_max` bigint DEFAULT NULL;

ALTER TABLE `contractor_profiles`
  ADD COLUMN `representative_name` varchar(30) DEFAULT NULL,
  ADD COLUMN `company_address` varchar(200) DEFAULT NULL,
  ADD COLUMN `business_address` varchar(200) DEFAULT NULL,
  ADD COLUMN `construction_experience_months` int DEFAULT NULL,
  ADD COLUMN `travel_distance_km` int DEFAULT NULL,
  ADD COLUMN `business_registration_certificate_url` varchar(300) DEFAULT NULL;

ALTER TABLE `contractor_quote`
  ADD COLUMN `revision_target_item_ids` varchar(200) DEFAULT NULL,
  ADD COLUMN `revision_requested_amount` bigint DEFAULT NULL;

ALTER TABLE `user_account`
  ADD COLUMN `email_verified` bit(1) NOT NULL DEFAULT b'0',
  ADD COLUMN `email_verification_code` varchar(10) DEFAULT NULL,
  ADD COLUMN `email_verification_expires_at` datetime(6) DEFAULT NULL,
  MODIFY COLUMN `username` varchar(50) DEFAULT NULL;
