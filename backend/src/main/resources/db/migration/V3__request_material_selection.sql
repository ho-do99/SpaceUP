ALTER TABLE `quote_request`
  ADD COLUMN `selected_theme` varchar(20) DEFAULT NULL AFTER `requested_items`,
  ADD COLUMN `selected_wallpaper_product_id` bigint unsigned DEFAULT NULL AFTER `selected_theme`,
  ADD COLUMN `selected_flooring_product_id` bigint unsigned DEFAULT NULL AFTER `selected_wallpaper_product_id`,
  ADD COLUMN `selected_lighting_product_id` bigint unsigned DEFAULT NULL AFTER `selected_flooring_product_id`,
  ADD KEY `ix_quote_request_selected_wallpaper` (`selected_wallpaper_product_id`),
  ADD KEY `ix_quote_request_selected_flooring` (`selected_flooring_product_id`),
  ADD KEY `ix_quote_request_selected_lighting` (`selected_lighting_product_id`),
  ADD CONSTRAINT `fk_quote_request_selected_wallpaper`
    FOREIGN KEY (`selected_wallpaper_product_id`) REFERENCES `material_product` (`product_id`),
  ADD CONSTRAINT `fk_quote_request_selected_flooring`
    FOREIGN KEY (`selected_flooring_product_id`) REFERENCES `material_product` (`product_id`),
  ADD CONSTRAINT `fk_quote_request_selected_lighting`
    FOREIGN KEY (`selected_lighting_product_id`) REFERENCES `material_product` (`product_id`),
  ADD CONSTRAINT `ck_quote_request_selected_theme`
    CHECK (`selected_theme` IS NULL OR `selected_theme` IN ('MODERN', 'WOOD', 'WHITE', 'MARBLE'));
