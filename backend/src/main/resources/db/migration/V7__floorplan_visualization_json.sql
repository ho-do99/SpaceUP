ALTER TABLE `analysis_job`
    ADD COLUMN `floorplan_visualization_json` JSON NULL AFTER `total_wallpaper_area_m2`;
