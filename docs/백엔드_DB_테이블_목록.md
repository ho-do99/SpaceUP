# 백엔드에서 생성되는 DB 테이블 전체 목록

> `backend/` 실행 시 `ddl-auto: update` 설정으로 JPA(Hibernate)가 아래 `@Entity` 클래스들을 보고 테이블을 자동 생성/갱신합니다. 별도로 실행해야 하는 SQL은 없습니다. 총 **17개 테이블**.

| 테이블명 | 도메인 | 생성 코드(엔티티 파일) | PK | 주요 컬럼 | 참조(FK) |
| --- | --- | --- | --- | --- | --- |
| `user_account` | member | `domain/member/entity/Member.java` | `user_id` | username, password_hash, email, user_name, phone, phone_verified, user_role(LANDLORD/CONTRACTOR/MATERIAL_VENDOR/ADMIN), approval_status, application_number, approval_number, deleted_at | - |
| `phone_verification` | member | `domain/member/entity/PhoneVerification.java` | `id` | phone_number, code, expires_at, verified | - (회원가입 전 인증용, 특정 회원에 연결 안 됨) |
| `property` | request | `domain/request/entity/Property.java` | `property_id` | region, housing_type, exclusive_area_m2, current_deposit, current_monthly_rent | `owner_id` → user_account |
| `quote_request` | request | `domain/request/entity/QuoteRequest.java` | `request_id` | request_code, budget_amount, budget_min, budget_max, target_rent, desired_date, requested_items, status, reject_reason | `owner_id`→user_account, `property_id`→property, `contractor_id`→user_account |
| `contractor_quote` | quote | `domain/quote/entity/ContractorQuote.java` | `quote_id` | total_amount, estimated_days, available_start_date, valid_until, status | `request_id`→quote_request, `contractor_id`→user_account |
| `contractor_quote_item` | quote | `domain/quote/entity/ContractorQuoteItem.java` | `quote_item_id` | work_type, description, amount | `quote_id`→contractor_quote |
| `analysis_job` | analysis | `domain/analysis/entity/AnalysisJob.java` | `analysis_id` | status, room_count, bathroom_count, space_score, matching_score, estimated_quote_min/max, deposit_increase_min/max, preliminary_deposit/rent_increase_min/max | `request_id`→quote_request |
| `contractor_profiles` | contractor | `domain/contractor/entity/ContractorProfile.java` | `id` | business_reg_no, company_name, activity_regions, specialties, rating, review_count, estimate_min/max, available_from_date, profile_public 등 공개설정 5종 | `member_id`→user_account |
| `products` | product | `domain/product/entity/Product.java` | `id` | product_code, name, category, spec, color, supply_price, sale_price, stock_qty, status | `vendor_id`→user_account |
| `material_orders` | order | `domain/order/entity/MaterialOrder.java` | `id` | order_code, quantity, order_amount, payment_completed, status | `product_id`→products, `buyer_id`→user_account |
| `settlements` | settlement | `domain/settlement/entity/Settlement.java` | `id` | transaction_code, transaction_amount, commission_amount, payout_amount, status | `partner_id`→user_account |
| `notifications` | notification | `domain/notification/entity/Notification.java` | `id` | type, title, content, is_read | `receiver_id`→user_account |
| `schedule_events` | schedule | `domain/schedule/entity/ScheduleEvent.java` | `id` | title, scheduled_at, status | `contractor_id`→user_account, `request_id`→quote_request |
| `portfolios` | portfolio | `domain/portfolio/entity/Portfolio.java` | `id` | project_name, region, property_type, area_m2, work_items, duration_days, amount, main_image_url, photo_urls, is_public | `contractor_id`→user_account |
| `system_settings` | admin | `domain/admin/entity/SystemSetting.java` | `id` | setting_key(unique), setting_value, description | - |
| `rental_transaction` | rental | `domain/rental/entity/RentalTransaction.java` | `id` | apartment_name, deal_year/month/day, deposit, monthly_rent, exclusive_use_area, sgg_code, source_key(unique), raw_payload(JSON) | - (외부 국토부 API 수집 데이터) |
| `rental_api_sync_log` | rental | `domain/rental/entity/RentalApiSyncLog.java` | `id` | lawd_cd, deal_ym, status, 수집/저장/실패 건수 | - |

---

## 참고

- **테이블을 안 만드는 것들**: `domain/matching`, `domain/file`은 `@Entity`가 없습니다 — matching은 그때그때 계산만 하고 저장 안 함, file(이미지 업로드)은 디스크에만 저장하고 DB 기록 없음.
- **모든 테이블에 공통으로 있는 컬럼**: `created_at`, `updated_at` — 대부분의 엔티티가 `BaseTimeEntity`(`global/entity/BaseTimeEntity.java`, `@MappedSuperclass`)를 상속해서 자동으로 채워집니다. `Member`(`user_account`)만 예외적으로 직접 `@PrePersist`/`@PreUpdate`로 처리합니다.
- **삭제된 테이블**: `boards`, `comments`, `upload_files` — 게시판 도메인 삭제하면서 같이 제거됨(최근 커밋).
- FK는 전부 `user_account.user_id`를 참조하는 구조가 많은데, 이는 임대인/시공사/자재업체/관리자가 전부 하나의 `Member` 엔티티(역할만 다름)로 관리되기 때문입니다.
