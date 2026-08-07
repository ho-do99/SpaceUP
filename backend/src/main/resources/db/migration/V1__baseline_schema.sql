
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analysis_job` (
  `analysis_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `bathroom_count` int DEFAULT NULL,
  `condition_score` int DEFAULT NULL,
  `estimated_quote_max` bigint DEFAULT NULL,
  `estimated_quote_min` bigint DEFAULT NULL,
  `expected_rent_increase_max` bigint DEFAULT NULL,
  `expected_rent_increase_min` bigint DEFAULT NULL,
  `has_balcony` bit(1) DEFAULT NULL,
  `issue_tags` varchar(500) DEFAULT NULL,
  `kitchen_type` varchar(20) DEFAULT NULL,
  `matching_score` int DEFAULT NULL,
  `payback_period_months_max` int DEFAULT NULL,
  `payback_period_months_min` int DEFAULT NULL,
  `room_count` int DEFAULT NULL,
  `space_score` int DEFAULT NULL,
  `status` enum('COMPLETED','FAILED','PENDING') NOT NULL,
  `request_id` bigint NOT NULL,
  `deposit_increase_max` bigint DEFAULT NULL,
  `deposit_increase_min` bigint DEFAULT NULL,
  `preliminary_deposit_increase_max` bigint DEFAULT NULL,
  `preliminary_deposit_increase_min` bigint DEFAULT NULL,
  `preliminary_rent_increase_max` bigint DEFAULT NULL,
  `preliminary_rent_increase_min` bigint DEFAULT NULL,
  `ceiling_height_m` double DEFAULT NULL,
  `total_floor_area_m2` double DEFAULT NULL,
  `total_wallpaper_area_m2` double DEFAULT NULL,
  PRIMARY KEY (`analysis_id`),
  UNIQUE KEY `UKjqnl70rwc7idibcaclguf78qd` (`request_id`),
  CONSTRAINT `FK83wemafecpklvjcj8noo7droo` FOREIGN KEY (`request_id`) REFERENCES `quote_request` (`request_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analysis_space` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `analysis_id` bigint NOT NULL,
  `space_name` varchar(30) NOT NULL,
  `space_area_m2` double DEFAULT NULL,
  `floor_area_m2` double DEFAULT NULL,
  `wallpaper_area_m2` double DEFAULT NULL,
  `selected_for_construction` bit(1) NOT NULL DEFAULT b'1',
  `sort_order` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_analysis_space_order` (`analysis_id`,`sort_order`),
  CONSTRAINT `fk_analysis_space_analysis` FOREIGN KEY (`analysis_id`) REFERENCES `analysis_job` (`analysis_id`) ON DELETE CASCADE,
  CONSTRAINT `ck_analysis_space_area` CHECK ((((`space_area_m2` is null) or (`space_area_m2` >= 0)) and ((`floor_area_m2` is null) or (`floor_area_m2` >= 0)) and ((`wallpaper_area_m2` is null) or (`wallpaper_area_m2` >= 0)))),
  CONSTRAINT `ck_analysis_space_name` CHECK ((char_length(trim(`space_name`)) > 0)),
  CONSTRAINT `ck_analysis_space_selected` CHECK ((`selected_for_construction` in (0x00,0x01))),
  CONSTRAINT `ck_analysis_space_sort_order` CHECK ((`sort_order` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `apartments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `road_address` varchar(200) DEFAULT NULL,
  `lot_address` varchar(200) DEFAULT NULL,
  `region` varchar(50) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_apartments_region_name` (`region`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `request_id` bigint NOT NULL,
  `contractor_id` bigint NOT NULL,
  `sender_type` enum('LANDLORD','CONTRACTOR','SYSTEM') NOT NULL,
  `sender_id` bigint DEFAULT NULL,
  `content` varchar(1000) NOT NULL,
  `is_read` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_thread_created` (`request_id`,`contractor_id`,`created_at`),
  KEY `fk_chat_messages_contractor` (`contractor_id`),
  KEY `fk_chat_messages_sender` (`sender_id`),
  KEY `idx_chat_messages_thread_unread` (`request_id`,`contractor_id`,`is_read`,`sender_type`),
  CONSTRAINT `fk_chat_messages_contractor` FOREIGN KEY (`contractor_id`) REFERENCES `user_account` (`user_id`),
  CONSTRAINT `fk_chat_messages_request` FOREIGN KEY (`request_id`) REFERENCES `quote_request` (`request_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `user_account` (`user_id`),
  CONSTRAINT `ck_chat_messages_content` CHECK ((char_length(trim(`content`)) > 0)),
  CONSTRAINT `ck_chat_messages_sender` CHECK ((((`sender_type` = _utf8mb4'SYSTEM') and (`sender_id` is null)) or ((`sender_type` in (_utf8mb4'LANDLORD',_utf8mb4'CONTRACTOR')) and (`sender_id` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contractor_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `activity_regions` varchar(200) DEFAULT NULL,
  `available_for_consult` bit(1) NOT NULL,
  `business_reg_no` varchar(20) DEFAULT NULL,
  `company_name` varchar(50) DEFAULT NULL,
  `completed_project_count` int DEFAULT NULL,
  `consultation_hours` varchar(50) DEFAULT NULL,
  `contact_public` bit(1) NOT NULL,
  `introduction` varchar(500) DEFAULT NULL,
  `manager_position` varchar(30) DEFAULT NULL,
  `portfolio_public` bit(1) NOT NULL,
  `portfolio_url` varchar(300) DEFAULT NULL,
  `profile_public` bit(1) NOT NULL,
  `rating` double DEFAULT NULL,
  `region_public` bit(1) NOT NULL,
  `specialties` varchar(200) DEFAULT NULL,
  `specialty_public` bit(1) NOT NULL,
  `member_id` bigint NOT NULL,
  `available_from_date` date DEFAULT NULL,
  `estimate_max` bigint DEFAULT NULL,
  `estimate_min` bigint DEFAULT NULL,
  `review_count` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK5spx1bpmfmbswxqe0tdtnvc3p` (`member_id`),
  CONSTRAINT `FKfgih2xkrx5nysmfhu5cbxr1d6` FOREIGN KEY (`member_id`) REFERENCES `user_account` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contractor_projects` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `request_id` bigint NOT NULL,
  `quote_id` bigint NOT NULL,
  `status` enum('VISIT_SCHEDULED','START_SCHEDULED','IN_PROGRESS','COMPLETION_REQUESTED','COMPLETED') NOT NULL,
  `contract_date` date DEFAULT NULL,
  `contract_amount` bigint DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `construction_items` varchar(200) DEFAULT NULL,
  `customer_request` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_contractor_projects_request` (`request_id`),
  UNIQUE KEY `uk_contractor_projects_quote` (`quote_id`),
  CONSTRAINT `fk_contractor_projects_quote` FOREIGN KEY (`quote_id`) REFERENCES `contractor_quote` (`quote_id`),
  CONSTRAINT `fk_contractor_projects_request` FOREIGN KEY (`request_id`) REFERENCES `quote_request` (`request_id`) ON DELETE CASCADE,
  CONSTRAINT `ck_contractor_projects_amount` CHECK (((`contract_amount` is null) or (`contract_amount` >= 0))),
  CONSTRAINT `ck_contractor_projects_dates` CHECK (((`start_date` is null) or (`completion_date` is null) or (`completion_date` >= `start_date`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contractor_quote` (
  `quote_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `detail_content` varchar(500) DEFAULT NULL,
  `discount` bigint DEFAULT NULL,
  `estimated_days` int DEFAULT NULL,
  `labor_cost` bigint DEFAULT NULL,
  `material_cost` bigint DEFAULT NULL,
  `revision_count` int NOT NULL,
  `revision_request_note` varchar(500) DEFAULT NULL,
  `available_start_date` varchar(255) DEFAULT NULL,
  `status` enum('ACCEPTED','DRAFT','REJECTED','SUBMITTED') NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `total_amount` bigint DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `vat` bigint DEFAULT NULL,
  `contractor_id` bigint NOT NULL,
  `request_id` bigint NOT NULL,
  PRIMARY KEY (`quote_id`),
  KEY `idx_contractor_quote_contractor_status` (`contractor_id`,`status`),
  KEY `idx_contractor_quote_request_status_updated` (`request_id`,`status`,`updated_at` DESC),
  CONSTRAINT `FK1xfih29s6vimwgmi5kpdqmsxg` FOREIGN KEY (`contractor_id`) REFERENCES `user_account` (`user_id`),
  CONSTRAINT `FK48dkalwi2r7euana0225a7pah` FOREIGN KEY (`request_id`) REFERENCES `quote_request` (`request_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contractor_quote_item` (
  `quote_item_id` bigint NOT NULL AUTO_INCREMENT,
  `amount` bigint NOT NULL,
  `work_type` varchar(30) NOT NULL,
  `description` varchar(100) DEFAULT NULL,
  `quote_id` bigint NOT NULL,
  PRIMARY KEY (`quote_item_id`),
  KEY `FKr3hk7f964v7ywn6si8h1tishk` (`quote_id`),
  CONSTRAINT `FKr3hk7f964v7ywn6si8h1tishk` FOREIGN KEY (`quote_id`) REFERENCES `contractor_quote` (`quote_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `floorplan_variants` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `apartment_id` bigint NOT NULL,
  `exclusive_area_m2` double NOT NULL,
  `supply_area_m2` double DEFAULT NULL,
  `type_label` varchar(30) DEFAULT NULL,
  `room_count` int DEFAULT NULL,
  `floor_plan_image_url` varchar(300) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_floorplan_variants_search` (`apartment_id`,`exclusive_area_m2`,`room_count`),
  CONSTRAINT `fk_floorplan_variants_apartment` FOREIGN KEY (`apartment_id`) REFERENCES `apartments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_floorplan_variants_area` CHECK ((`exclusive_area_m2` > 0)),
  CONSTRAINT `ck_floorplan_variants_room_count` CHECK (((`room_count` is null) or (`room_count` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_product` (
  `product_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `work_type` varchar(20) NOT NULL,
  `material_category` varchar(50) NOT NULL,
  `theme` varchar(20) NOT NULL,
  `price_tier` varchar(20) NOT NULL,
  `brand_name` varchar(100) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `model_code` varchar(100) DEFAULT NULL,
  `source_name` varchar(50) NOT NULL,
  `source_product_key` varchar(150) NOT NULL,
  `product_url` varchar(1000) DEFAULT NULL,
  `image_url` varchar(1000) DEFAULT NULL,
  `sale_unit` varchar(20) NOT NULL,
  `coverage_per_unit_m2` decimal(10,3) DEFAULT NULL,
  `current_price` decimal(15,0) NOT NULL,
  `normalized_price_m2` decimal(15,2) DEFAULT NULL,
  `spec_json` json DEFAULT NULL,
  `verified_yn` tinyint(1) NOT NULL DEFAULT '0',
  `price_checked_at` datetime NOT NULL,
  `active_yn` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `uk_material_product_source_key` (`source_name`,`source_product_key`),
  KEY `ix_material_product_catalog` (`theme`,`work_type`,`active_yn`,`price_tier`,`current_price`),
  CONSTRAINT `ck_material_product_active_yn` CHECK ((`active_yn` in (0,1))),
  CONSTRAINT `ck_material_product_category_nonblank` CHECK ((char_length(trim(`material_category`)) > 0)),
  CONSTRAINT `ck_material_product_coverage` CHECK ((((`work_type` in (_utf8mb4'WALLPAPER',_utf8mb4'FLOORING')) and (`sale_unit` in (_utf8mb4'ROLL',_utf8mb4'BOX',_utf8mb4'M2')) and ((`coverage_per_unit_m2` is null) or (`coverage_per_unit_m2` > 0)) and ((`normalized_price_m2` is null) or (`normalized_price_m2` >= 0))) or ((`work_type` = _utf8mb4'LIGHTING') and (`sale_unit` = _utf8mb4'EA') and (`coverage_per_unit_m2` is null) and (`normalized_price_m2` is null)))),
  CONSTRAINT `ck_material_product_name_nonblank` CHECK ((char_length(trim(`product_name`)) > 0)),
  CONSTRAINT `ck_material_product_price_tier` CHECK ((`price_tier` in (_utf8mb4'LOW',_utf8mb4'MID',_utf8mb4'HIGH'))),
  CONSTRAINT `ck_material_product_prices` CHECK (((`current_price` >= 0) and ((`normalized_price_m2` is null) or (`normalized_price_m2` >= 0)))),
  CONSTRAINT `ck_material_product_sale_unit` CHECK ((`sale_unit` in (_utf8mb4'ROLL',_utf8mb4'BOX',_utf8mb4'M2',_utf8mb4'EA'))),
  CONSTRAINT `ck_material_product_source_key_nonblank` CHECK ((char_length(trim(`source_product_key`)) > 0)),
  CONSTRAINT `ck_material_product_source_name` CHECK ((`source_name` in (_utf8mb4'WALLPLAN',_utf8mb4'OHOUSE',_utf8mb4'JANGPANNARA',_utf8mb4'IKEA'))),
  CONSTRAINT `ck_material_product_theme` CHECK ((`theme` in (_utf8mb4'MODERN',_utf8mb4'WOOD',_utf8mb4'WHITE',_utf8mb4'MARBLE'))),
  CONSTRAINT `ck_material_product_verified_yn` CHECK ((`verified_yn` in (0,1))),
  CONSTRAINT `ck_material_product_work_type` CHECK ((`work_type` in (_utf8mb4'WALLPAPER',_utf8mb4'FLOORING',_utf8mb4'LIGHTING')))
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `content` varchar(300) DEFAULT NULL,
  `is_read` bit(1) NOT NULL,
  `title` varchar(100) NOT NULL,
  `type` enum('QUOTE','SCHEDULE','REQUEST','SETTLEMENT','CHAT','VISIT','REVIEW','PROJECT') NOT NULL,
  `receiver_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_receiver_created` (`receiver_id`,`created_at` DESC),
  KEY `idx_notifications_receiver_read` (`receiver_id`,`is_read`),
  CONSTRAINT `FKqesifh3v50t1nkbdiyh77j3nk` FOREIGN KEY (`receiver_id`) REFERENCES `user_account` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phone_verification` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(10) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `verified` bit(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `portfolios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `amount` bigint DEFAULT NULL,
  `area_m2` double DEFAULT NULL,
  `duration_days` int DEFAULT NULL,
  `is_public` bit(1) NOT NULL,
  `main_image_url` varchar(500) DEFAULT NULL,
  `photo_urls` varchar(2000) DEFAULT NULL,
  `project_name` varchar(100) NOT NULL,
  `property_type` varchar(20) DEFAULT NULL,
  `region` varchar(50) DEFAULT NULL,
  `work_items` varchar(200) DEFAULT NULL,
  `contractor_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKm8de6idxpg8t5gd3uy2f8dg6r` (`contractor_id`),
  CONSTRAINT `FKm8de6idxpg8t5gd3uy2f8dg6r` FOREIGN KEY (`contractor_id`) REFERENCES `user_account` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_checklist_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `project_id` bigint NOT NULL,
  `label` varchar(100) NOT NULL,
  `completed` bit(1) NOT NULL DEFAULT b'0',
  `sort_order` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_checklist_order` (`project_id`,`sort_order`),
  CONSTRAINT `fk_project_checklist_project` FOREIGN KEY (`project_id`) REFERENCES `contractor_projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_project_checklist_label` CHECK ((char_length(trim(`label`)) > 0)),
  CONSTRAINT `ck_project_checklist_sort_order` CHECK ((`sort_order` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `property` (
  `property_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `current_deposit` bigint DEFAULT NULL,
  `current_monthly_rent` bigint DEFAULT NULL,
  `exclusive_area_m2` double NOT NULL,
  `housing_type` varchar(20) NOT NULL,
  `region` varchar(50) NOT NULL,
  `owner_id` bigint NOT NULL,
  PRIMARY KEY (`property_id`),
  KEY `FKsw41ya3uu150g38yu12w6uo4u` (`owner_id`),
  CONSTRAINT `FKsw41ya3uu150g38yu12w6uo4u` FOREIGN KEY (`owner_id`) REFERENCES `user_account` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quote_request` (
  `request_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `budget_amount` bigint DEFAULT NULL,
  `budget_max` bigint DEFAULT NULL,
  `budget_min` bigint DEFAULT NULL,
  `desired_date` varchar(255) DEFAULT NULL,
  `last_activity_at` datetime(6) DEFAULT NULL,
  `reject_reason` enum('BUDGET_MISMATCH','OTHER','REGION_NOT_SUPPORTED','SCHEDULE_CONFLICT','SPECIALTY_MISMATCH') DEFAULT NULL,
  `reject_reason_detail` varchar(300) DEFAULT NULL,
  `request_code` varchar(30) DEFAULT NULL,
  `requested_items` varchar(200) DEFAULT NULL,
  `status` enum('APPROVED','CANCELED','COMPLETED','IN_PROGRESS','NEW','QUOTE_REQUESTED','REJECTED','REVIEWING') NOT NULL,
  `target_rent` bigint DEFAULT NULL,
  `warning_sent` bit(1) NOT NULL,
  `contractor_id` bigint DEFAULT NULL,
  `owner_id` bigint NOT NULL,
  `property_id` bigint NOT NULL,
  PRIMARY KEY (`request_id`),
  UNIQUE KEY `UK50g29f937p02fhlvgi7kdo8en` (`request_code`),
  KEY `FK5x6rnn4vfxm3caoqnr9y0gflg` (`contractor_id`),
  KEY `FK5b7eycmcu9t06i2ow4r1rsmt8` (`owner_id`),
  KEY `FKmx2liu993klhd9vtvhm9dgk95` (`property_id`),
  CONSTRAINT `FK5b7eycmcu9t06i2ow4r1rsmt8` FOREIGN KEY (`owner_id`) REFERENCES `user_account` (`user_id`),
  CONSTRAINT `FK5x6rnn4vfxm3caoqnr9y0gflg` FOREIGN KEY (`contractor_id`) REFERENCES `user_account` (`user_id`),
  CONSTRAINT `FKmx2liu993klhd9vtvhm9dgk95` FOREIGN KEY (`property_id`) REFERENCES `property` (`property_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rental_api_sync_log` (
  `rental_api_sync_log_id` bigint NOT NULL AUTO_INCREMENT,
  `api_total_count` int NOT NULL,
  `deal_ym` varchar(6) NOT NULL,
  `duplicate_count` int NOT NULL,
  `error_code` varchar(50) DEFAULT NULL,
  `error_message` varchar(500) DEFAULT NULL,
  `failed_count` int NOT NULL,
  `finished_at` datetime(6) DEFAULT NULL,
  `inserted_count` int NOT NULL,
  `lawd_cd` varchar(5) NOT NULL,
  `received_count` int NOT NULL,
  `started_at` datetime(6) NOT NULL,
  `status` enum('FAILED','PARTIAL_SUCCESS','RUNNING','SUCCESS') NOT NULL,
  PRIMARY KEY (`rental_api_sync_log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rental_transaction` (
  `rental_transaction_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `apartment_name` varchar(200) DEFAULT NULL,
  `apartment_sequence` varchar(50) DEFAULT NULL,
  `build_year` int DEFAULT NULL,
  `contract_term` varchar(30) DEFAULT NULL,
  `contract_type` varchar(30) DEFAULT NULL,
  `deal_day` int DEFAULT NULL,
  `deal_month` int DEFAULT NULL,
  `deal_year` int DEFAULT NULL,
  `deposit` bigint DEFAULT NULL,
  `exclusive_use_area` decimal(10,4) DEFAULT NULL,
  `floor` int DEFAULT NULL,
  `jibun` varchar(50) DEFAULT NULL,
  `monthly_rent` bigint DEFAULT NULL,
  `previous_deposit` bigint DEFAULT NULL,
  `previous_monthly_rent` bigint DEFAULT NULL,
  `raw_payload` json NOT NULL,
  `renewal_request_right_used` varchar(30) DEFAULT NULL,
  `road_name` varchar(200) DEFAULT NULL,
  `road_name_basement_code` varchar(10) DEFAULT NULL,
  `road_name_code` varchar(30) DEFAULT NULL,
  `road_name_main_number` varchar(20) DEFAULT NULL,
  `road_name_sequence` varchar(20) DEFAULT NULL,
  `road_name_sgg_code` varchar(10) DEFAULT NULL,
  `road_name_sub_number` varchar(20) DEFAULT NULL,
  `sgg_code` varchar(5) DEFAULT NULL,
  `source_key` char(64) NOT NULL,
  `umd_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`rental_transaction_id`),
  UNIQUE KEY `uk_rental_transaction_source_key` (`source_key`),
  KEY `idx_rental_transaction_region_month` (`sgg_code`,`deal_year`,`deal_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `request_contractors` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `request_id` bigint NOT NULL,
  `contractor_id` bigint NOT NULL,
  `status` enum('INVITED','APPROVED','REJECTED','SELECTED','CLOSED') NOT NULL,
  `reject_reason` enum('BUDGET_MISMATCH','OTHER','REGION_NOT_SUPPORTED','SCHEDULE_CONFLICT','SPECIALTY_MISMATCH') DEFAULT NULL,
  `reject_reason_detail` varchar(300) DEFAULT NULL,
  `matching_score` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_request_contractors_request_contractor` (`request_id`,`contractor_id`),
  KEY `fk_request_contractors_contractor` (`contractor_id`),
  CONSTRAINT `fk_request_contractors_contractor` FOREIGN KEY (`contractor_id`) REFERENCES `user_account` (`user_id`),
  CONSTRAINT `fk_request_contractors_request` FOREIGN KEY (`request_id`) REFERENCES `quote_request` (`request_id`) ON DELETE CASCADE,
  CONSTRAINT `ck_request_contractors_reject_reason` CHECK (((`status` <> _utf8mb4'REJECTED') or (`reject_reason` is not null)))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `request_image` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `request_id` bigint NOT NULL,
  `image_type` enum('FLOOR_PLAN','PHOTO') NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `sort_order` int NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_request_image_order` (`request_id`,`image_type`,`sort_order`),
  CONSTRAINT `fk_request_image_request` FOREIGN KEY (`request_id`) REFERENCES `quote_request` (`request_id`) ON DELETE CASCADE,
  CONSTRAINT `ck_request_image_sort_order` CHECK ((`sort_order` >= 0)),
  CONSTRAINT `ck_request_image_url` CHECK ((char_length(trim(`image_url`)) > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `request_id` bigint NOT NULL,
  `reviewer_id` bigint NOT NULL,
  `contractor_id` bigint NOT NULL,
  `rating` int NOT NULL,
  `content` varchar(1000) NOT NULL,
  `keywords` varchar(200) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reviews_request` (`request_id`),
  KEY `idx_reviews_contractor_rating_created` (`contractor_id`,`rating`,`created_at`),
  KEY `idx_reviews_reviewer` (`reviewer_id`),
  CONSTRAINT `fk_reviews_contractor` FOREIGN KEY (`contractor_id`) REFERENCES `user_account` (`user_id`),
  CONSTRAINT `fk_reviews_request` FOREIGN KEY (`request_id`) REFERENCES `quote_request` (`request_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `user_account` (`user_id`),
  CONSTRAINT `ck_reviews_content` CHECK ((char_length(trim(`content`)) > 0)),
  CONSTRAINT `ck_reviews_rating` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settlements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `commission_amount` bigint NOT NULL,
  `payout_amount` bigint NOT NULL,
  `status` enum('PENDING','SETTLED') NOT NULL,
  `transaction_amount` bigint NOT NULL,
  `transaction_code` varchar(30) DEFAULT NULL,
  `partner_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKbwsphlepx6fj5n7sws806sodg` (`transaction_code`),
  KEY `FKhee44uwgltqe81kosdyj715rh` (`partner_id`),
  CONSTRAINT `FKhee44uwgltqe81kosdyj715rh` FOREIGN KEY (`partner_id`) REFERENCES `user_account` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_visits` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `request_id` bigint NOT NULL,
  `contractor_id` bigint NOT NULL,
  `status` enum('UNSCHEDULED','SCHEDULED','CHANGE_REQUESTED','COMPLETED') NOT NULL,
  `visit_date` date DEFAULT NULL,
  `visit_time` time(6) DEFAULT NULL,
  `manager_name` varchar(50) DEFAULT NULL,
  `note` varchar(300) DEFAULT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `requested_date` date DEFAULT NULL,
  `requested_time` time(6) DEFAULT NULL,
  `request_reason` varchar(300) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_site_visits_request_contractor` (`request_id`,`contractor_id`),
  KEY `fk_site_visits_contractor` (`contractor_id`),
  CONSTRAINT `fk_site_visits_contractor` FOREIGN KEY (`contractor_id`) REFERENCES `user_account` (`user_id`),
  CONSTRAINT `fk_site_visits_request` FOREIGN KEY (`request_id`) REFERENCES `quote_request` (`request_id`) ON DELETE CASCADE,
  CONSTRAINT `ck_site_visits_state` CHECK (((`status` = _utf8mb4'UNSCHEDULED') or ((`status` = _utf8mb4'SCHEDULED') and (`visit_date` is not null) and (`visit_time` is not null)) or ((`status` = _utf8mb4'CHANGE_REQUESTED') and (`visit_date` is not null) and (`visit_time` is not null) and (`requested_date` is not null) and (`requested_time` is not null)) or ((`status` = _utf8mb4'COMPLETED') and (`visit_date` is not null) and (`visit_time` is not null) and (`completed_at` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `description` varchar(200) DEFAULT NULL,
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKnm18l4pyovtvd8y3b3x0l2y64` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_account` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `application_number` varchar(30) DEFAULT NULL,
  `approval_number` varchar(30) DEFAULT NULL,
  `approval_status` enum('APPROVED','NEEDS_REVISION','PENDING') NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `user_name` varchar(30) NOT NULL,
  `password_hash` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `phone_verification_code` varchar(10) DEFAULT NULL,
  `phone_verification_expires_at` datetime(6) DEFAULT NULL,
  `phone_verified` bit(1) NOT NULL,
  `revision_deadline` datetime(6) DEFAULT NULL,
  `revision_message` varchar(500) DEFAULT NULL,
  `user_role` enum('LANDLORD','CONTRACTOR','ADMIN') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `withdrawn` bit(1) NOT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `UKcastjbvpeeus0r8lbpehiu0e4` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
