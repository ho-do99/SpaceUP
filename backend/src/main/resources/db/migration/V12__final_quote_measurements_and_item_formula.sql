ALTER TABLE `contractor_quote`
  ADD COLUMN `floor_area_m2` decimal(10,2) DEFAULT NULL AFTER `estimated_days`,
  ADD COLUMN `wallpaper_area_m2` decimal(10,2) DEFAULT NULL AFTER `floor_area_m2`,
  ADD COLUMN `lighting_quantity` int DEFAULT NULL AFTER `wallpaper_area_m2`,
  ADD COLUMN `ceiling_height_m` decimal(5,2) DEFAULT NULL AFTER `lighting_quantity`,
  ADD COLUMN `room_count` int DEFAULT NULL AFTER `ceiling_height_m`,
  ADD COLUMN `bathroom_count` int DEFAULT NULL AFTER `room_count`,
  ADD COLUMN `site_condition` varchar(300) DEFAULT NULL AFTER `bathroom_count`;

ALTER TABLE `contractor_quote_item`
  MODIFY COLUMN `description` varchar(500) DEFAULT NULL,
  ADD COLUMN `quantity` decimal(10,2) DEFAULT NULL AFTER `description`,
  ADD COLUMN `measurement_unit` varchar(10) DEFAULT NULL AFTER `quantity`,
  ADD COLUMN `unit_price` bigint DEFAULT NULL AFTER `measurement_unit`;
