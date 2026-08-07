-- SpaceUp material catalog transition
-- Applied manually after taking a full database backup.
-- Replaces vendor-owned products/orders with a read-only, source-backed catalog.
-- MySQL DDL causes implicit commits, so this file is intentionally treated as a backup-backed migration,
-- not as an all-or-nothing transaction.

ALTER TABLE material_product
    DROP CHECK ck_material_product_coverage,
    DROP CHECK ck_material_product_grade,
    DROP CHECK ck_material_product_source_name,
    DROP CHECK ck_material_product_work_type,
    DROP INDEX ix_material_product_recommendation,
    ADD COLUMN theme VARCHAR(20) NULL AFTER material_category,
    ADD COLUMN price_tier VARCHAR(20) NULL AFTER theme;

DELETE FROM material_product;

ALTER TABLE material_product
    MODIFY COLUMN theme VARCHAR(20) NOT NULL,
    MODIFY COLUMN price_tier VARCHAR(20) NOT NULL,
    DROP COLUMN grade,
    ADD CONSTRAINT ck_material_product_theme
        CHECK (theme IN ('MODERN', 'WOOD', 'WHITE', 'MARBLE')),
    ADD CONSTRAINT ck_material_product_price_tier
        CHECK (price_tier IN ('LOW', 'MID', 'HIGH')),
    ADD CONSTRAINT ck_material_product_source_name
        CHECK (source_name IN ('WALLPLAN', 'OHOUSE', 'JANGPANNARA', 'IKEA')),
    ADD CONSTRAINT ck_material_product_work_type
        CHECK (work_type IN ('WALLPAPER', 'FLOORING', 'LIGHTING')),
    ADD CONSTRAINT ck_material_product_coverage
        CHECK (
            (work_type IN ('WALLPAPER', 'FLOORING')
                AND sale_unit IN ('ROLL', 'BOX', 'M2')
                AND (coverage_per_unit_m2 IS NULL OR coverage_per_unit_m2 > 0)
                AND (normalized_price_m2 IS NULL OR normalized_price_m2 >= 0))
            OR
            (work_type = 'LIGHTING' AND sale_unit = 'EA'
                AND coverage_per_unit_m2 IS NULL AND normalized_price_m2 IS NULL)
        ),
    ADD INDEX ix_material_product_catalog
        (theme, work_type, active_yn, price_tier, current_price);

-- Wallpaper: low=paper, mid=silk, high=premium silk. One roll is approximately 16.5 m2.
INSERT INTO material_product
(work_type, material_category, theme, price_tier, brand_name, product_name, model_code,
 source_name, source_product_key, product_url, image_url, sale_unit, coverage_per_unit_m2,
 current_price, normalized_price_m2, spec_json, verified_yn, price_checked_at, active_yn)
VALUES
('WALLPAPER','PAPER','MODERN','LOW','개나리벽지','트랜디 다니엘 라이트그레이','39369-5','WALLPLAN','1000017138','https://www.wallplan.co.kr/goods/goods_view.php?goodsNo=1000017138',NULL,'ROLL',16.500,18900,1145.45,JSON_OBJECT('color','라이트그레이','finish','미세펄','rollSize','1롤 5평'),1,'2026-08-06 00:00:00',1),
('WALLPAPER','SILK','MODERN','MID','개나리벽지','로하스 샌드플라스터 클린그레이','87486-3','WALLPLAN','87486-3','https://www.wallplan.co.kr/goods/goods_list.php?cateCd=054010&page=19',NULL,'ROLL',16.500,40900,2478.79,JSON_OBJECT('color','클린그레이','finish','실크','rollSize','106cm x 15.6m'),1,'2026-08-06 00:00:00',1),
('WALLPAPER','PREMIUM_SILK','MODERN','HIGH','LX Z:IN','디아망 모던페인팅 웜화이트','PR027-05','OHOUSE','2698490','https://store.ohou.se/goods/2698490',NULL,'ROLL',16.500,76000,4606.06,JSON_OBJECT('color','웜화이트','finish','프리미엄 실크'),1,'2026-08-06 00:00:00',1),

('WALLPAPER','PAPER','WOOD','LOW','개나리벽지','트랜디 다니엘 그레이지','39369-3','WALLPLAN','1000017140','https://www.wallplan.co.kr/goods/goods_view.php?goodsNo=1000017140',NULL,'ROLL',16.500,18900,1145.45,JSON_OBJECT('color','그레이지','finish','미세펄','rollSize','1롤 5평'),1,'2026-08-06 00:00:00',1),
('WALLPAPER','SILK','WOOD','MID','개나리벽지','로하스 더치코트 모카브라운','87490-5','WALLPLAN','87490-5','https://www.wallplan.co.kr/goods/goods_list.php?cateCd=042004',NULL,'ROLL',16.500,40900,2478.79,JSON_OBJECT('color','모카브라운','finish','실크','rollSize','106cm x 15.6m'),1,'2026-08-06 00:00:00',1),
('WALLPAPER','PREMIUM_SILK','WOOD','HIGH','LX Z:IN','디아망 포티스 유러피안 플라스터 샌디크림','DF001-01','OHOUSE','3091994','https://store.ohou.se/goods/3091994',NULL,'ROLL',16.500,90000,5454.55,JSON_OBJECT('color','샌디크림','finish','프리미엄 실크'),1,'2026-08-06 00:00:00',1),

('WALLPAPER','PAPER','WHITE','LOW','개나리벽지','트랜디 조엘 린넨화이트','39374-1','WALLPLAN','1000017178','https://www.wallplan.co.kr/goods/goods_view.php?goodsNo=1000017178',NULL,'ROLL',16.500,18900,1145.45,JSON_OBJECT('color','린넨화이트','finish','미세펄','rollSize','1롤 5평'),1,'2026-08-06 00:00:00',1),
('WALLPAPER','SILK','WHITE','MID','개나리벽지','로하스 클레이회벽 클린화이트','87476-1','WALLPLAN','1000022374','https://www.wallplan.co.kr/goods/goods_view.php?goodsNo=1000022374',NULL,'ROLL',16.500,40900,2478.79,JSON_OBJECT('color','클린화이트','finish','무펄 실크','rollSize','106cm x 15.6m'),1,'2026-08-06 00:00:00',1),
('WALLPAPER','PREMIUM_SILK','WHITE','HIGH','LX Z:IN','디아망 샌드페인팅 화이트','PR030-01','OHOUSE','3853710-white','https://store.ohou.se/goods/3853710',NULL,'ROLL',16.500,69000,4181.82,JSON_OBJECT('color','화이트','finish','입체 실크','rollSize','106cm x 15.5m'),1,'2026-08-06 00:00:00',1),

('WALLPAPER','PAPER','MARBLE','LOW','개나리벽지','트랜디 유로피안 회벽 웜토프','39391-5','WALLPLAN','1000022705','https://www.wallplan.co.kr/goods/goods_view.php?goodsNo=1000022705',NULL,'ROLL',16.500,21900,1327.27,JSON_OBJECT('color','웜토프','pattern','회벽','rollSize','1롤 5평'),1,'2026-08-06 00:00:00',1),
('WALLPAPER','SILK','MARBLE','MID','개나리벽지','로하스 클래식 마블 크림블랑','87485-1','WALLPLAN','87485-1','https://www.wallplan.co.kr/goods/goods_list.php?cateCd=054010&page=19',NULL,'ROLL',16.500,40900,2478.79,JSON_OBJECT('color','크림블랑','pattern','클래식 마블','rollSize','106cm x 15.6m'),1,'2026-08-06 00:00:00',1),
('WALLPAPER','PREMIUM_SILK','MARBLE','HIGH','LX Z:IN','디아망 샌드페인팅 아이보리','PR030-02','OHOUSE','3853710-ivory','https://store.ohou.se/goods/3853710',NULL,'ROLL',16.500,69000,4181.82,JSON_OBJECT('color','아이보리','pattern','샌드페인팅','finish','입체 실크'),1,'2026-08-06 00:00:00',1),

-- Flooring: retailer box prices. Coverage is kept NULL unless the retailer states it explicitly.
('FLOORING','ENGINEERED_FLOOR','MODERN','LOW','동화자연마루','나투스진 퓨어그레이','JP004','JANGPANNARA','JP004','https://jangpannara.kr/category/%ED%93%A8%EC%96%B4-%EC%8B%9C%EB%A6%AC%EC%A6%88/2785/',NULL,'BOX',3.300,67100,20333.33,JSON_OBJECT('color','그레이','series','나투스진 퓨어'),1,'2026-08-06 00:00:00',1),
('FLOORING','TEXTURED_FLOOR','MODERN','MID','동화자연마루','나투스진 텍스쳐 럭스블랙','JT3018','JANGPANNARA','JT3018','https://jangpannara.kr/category/%EB%82%98%ED%88%AC%EC%8A%A4%EC%A7%84-%ED%85%8D%EC%8A%A4%EC%B3%90/3771/',NULL,'BOX',NULL,84200,NULL,JSON_OBJECT('color','럭스블랙','series','나투스진 텍스쳐'),1,'2026-08-06 00:00:00',1),
('FLOORING','SQUARE_FLOOR','MODERN','HIGH','동화자연마루','나투스강 스퀘어 맨하탄 클레이','SQUARE-MANHATTAN-CLAY','JANGPANNARA','SQUARE-MANHATTAN-CLAY','https://jangpannara.kr/category/%EB%8F%99%ED%99%94%EC%9E%90%EC%97%B0%EB%A7%88%EB%A3%A8/2304',NULL,'BOX',NULL,197200,NULL,JSON_OBJECT('color','맨하탄 클레이','pattern','대형 사각'),1,'2026-08-06 00:00:00',1),

('FLOORING','ENGINEERED_FLOOR','WOOD','LOW','동화자연마루','나투스진 퓨어브라운','JP010','JANGPANNARA','JP010','https://jangpannara.kr/category/%ED%93%A8%EC%96%B4-%EC%8B%9C%EB%A6%AC%EC%A6%88/2785/',NULL,'BOX',3.300,67100,20333.33,JSON_OBJECT('color','브라운','series','나투스진 퓨어'),1,'2026-08-06 00:00:00',1),
('FLOORING','ENGINEERED_FLOOR','WOOD','MID','동화자연마루','나투스진 테라 월넛','JE5006','JANGPANNARA','JE5006','https://jangpannara.kr/category/%EB%82%98%ED%88%AC%EC%8A%A4%EC%A7%84-%ED%85%8C%EB%9D%BC/3769/',NULL,'BOX',NULL,78900,NULL,JSON_OBJECT('color','월넛','series','나투스진 테라'),1,'2026-08-06 00:00:00',1),
('FLOORING','WIDE_ENGINEERED_FLOOR','WOOD','HIGH','동화자연마루','나투스진 테라맥스 브라운','JM6006','JANGPANNARA','JM6006','https://jangpannara.kr/category/%ED%85%8C%EB%9D%BC%EB%A7%A5%EC%8A%A4/3874/',NULL,'BOX',NULL,102700,NULL,JSON_OBJECT('color','브라운','series','나투스진 테라맥스'),1,'2026-08-06 00:00:00',1),

('FLOORING','ENGINEERED_FLOOR','WHITE','LOW','동화자연마루','나투스진 어반 화이트','JB001','JANGPANNARA','JB001','https://jangpannara.kr/category/%EB%82%98%ED%88%AC%EC%8A%A4%EC%A7%84%EC%84%AC%EC%9C%A0%ED%8C%90%EB%A7%88%EB%A3%A8/3898/',NULL,'BOX',3.300,71100,21545.45,JSON_OBJECT('color','어반 화이트','series','나투스진 어반'),1,'2026-08-06 00:00:00',1),
('FLOORING','TEXTURED_FLOOR','WHITE','MID','동화자연마루','나투스진 텍스쳐 실키화이트','JT3011','JANGPANNARA','JT3011','https://jangpannara.kr/category/%EB%82%98%ED%88%AC%EC%8A%A4%EC%A7%84-%ED%85%8D%EC%8A%A4%EC%B3%90/3771/',NULL,'BOX',NULL,84200,NULL,JSON_OBJECT('color','실키화이트','series','나투스진 텍스쳐'),1,'2026-08-06 00:00:00',1),
('FLOORING','SQUARE_FLOOR','WHITE','HIGH','동화자연마루','나투스강 스퀘어 플로쏘 화이트','SQUARE-FLOSSO-WHITE','JANGPANNARA','SQUARE-FLOSSO-WHITE','https://jangpannara.kr/category/%EB%8F%99%ED%99%94%EC%9E%90%EC%97%B0%EB%A7%88%EB%A3%A8/2304',NULL,'BOX',NULL,197200,NULL,JSON_OBJECT('color','플로쏘 화이트','pattern','대형 사각'),1,'2026-08-06 00:00:00',1),

('FLOORING','ENGINEERED_FLOOR','MARBLE','LOW','동화자연마루','나투스진 퓨어실버','JP001','JANGPANNARA','JP001','https://jangpannara.kr/category/%ED%93%A8%EC%96%B4-%EC%8B%9C%EB%A6%AC%EC%A6%88/2785/',NULL,'BOX',3.300,67100,20333.33,JSON_OBJECT('color','실버','series','나투스진 퓨어'),1,'2026-08-06 00:00:00',1),
('FLOORING','WIDE_ENGINEERED_FLOOR','MARBLE','MID','동화자연마루','나투스진 테라맥스 클레이','JM6005','JANGPANNARA','JM6005','https://jangpannara.kr/category/%ED%85%8C%EB%9D%BC%EB%A7%A5%EC%8A%A4/3874/',NULL,'BOX',NULL,102700,NULL,JSON_OBJECT('color','클레이','series','나투스진 테라맥스'),1,'2026-08-06 00:00:00',1),
('FLOORING','SQUARE_FLOOR','MARBLE','HIGH','동화자연마루','나투스강 스퀘어 몬테 크레마','SQUARE-MONTE-CREMA','JANGPANNARA','SQUARE-MONTE-CREMA','https://jangpannara.kr/category/%EB%8F%99%ED%99%94%EC%9E%90%EC%97%B0%EB%A7%88%EB%A3%A8/2304',NULL,'BOX',NULL,197200,NULL,JSON_OBJECT('color','몬테 크레마','pattern','석재 패턴 대형 사각'),1,'2026-08-06 00:00:00',1),

-- Lighting: prices and review-backed products from IKEA Korea's current catalog.
('LIGHTING','PENDANT','MODERN','LOW','IKEA','BRUNSTA 브룬스타 / HAVSDJUP 하브스디우프 펜던트등','BRUNSTA-HAVSDJUP-20','IKEA','BRUNSTA-HAVSDJUP-20','https://www.ikea.com/kr/ko/cat/pendants-18751/f/black-pendants-f-colors--10139/',NULL,'EA',NULL,29900,NULL,JSON_OBJECT('color','블랙','diameterCm',20,'room','주방/현관'),1,'2026-08-06 00:00:00',1),
('LIGHTING','LED_PENDANT','MODERN','MID','IKEA','NYMÅNE 뉘모네 LED 펜던트등','NYMANE-ANTHRACITE-38','IKEA','NYMANE-ANTHRACITE-38','https://www.ikea.com/kr/ko/cat/pendants-18751/f/black-pendants-f-colors--10139/',NULL,'EA',NULL,79900,NULL,JSON_OBJECT('color','앤트러싸이트','diameterCm',38,'room','거실/식탁'),1,'2026-08-06 00:00:00',1),
('LIGHTING','SMART_LED_PENDANT','MODERN','HIGH','IKEA','PILSKOTT 필스코트 스마트 LED 펜던트등','PILSKOTT-BLACK-97','IKEA','PILSKOTT-BLACK-97','https://www.ikea.com/kr/ko/cat/pendants-18751/f/black-pendants-f-colors--10139/',NULL,'EA',NULL,129000,NULL,JSON_OBJECT('color','블랙','lengthCm',97,'smart',true,'room','거실/식탁'),1,'2026-08-06 00:00:00',1),

('LIGHTING','BAMBOO_PENDANT','WOOD','LOW','IKEA','SINNERLIG 신넬리그 펜던트등','SINNERLIG-27','IKEA','SINNERLIG-27','https://www.ikea.com/kr/ko/cat/pendants-18751/',NULL,'EA',NULL,39900,NULL,JSON_OBJECT('material','대나무','diameterCm',27,'room','침실/식탁'),1,'2026-08-06 00:00:00',1),
('LIGHTING','BAMBOO_PENDANT','WOOD','MID','IKEA','MISTERHULT 미스테르훌트 펜던트등','MISTERHULT-45','IKEA','MISTERHULT-45','https://www.ikea.com/kr/ko/cat/pendants-18751/',NULL,'EA',NULL,79900,NULL,JSON_OBJECT('material','핸드메이드 대나무','diameterCm',45,'room','거실/식탁'),1,'2026-08-06 00:00:00',1),
('LIGHTING','BAMBOO_PENDANT','WOOD','HIGH','IKEA','VARPTROSS 바르프트로스 펜던트등','VARPTROSS-79','IKEA','VARPTROSS-79','https://www.ikea.com/kr/ko/cat/pendants-18751/',NULL,'EA',NULL,129000,NULL,JSON_OBJECT('material','대나무','diameterCm',79,'room','거실'),1,'2026-08-06 00:00:00',1),

('LIGHTING','PENDANT','WHITE','LOW','IKEA','ZEBRASÄV 세브라세브 펜던트등','ZEBRASAV-WHITE-46','IKEA','ZEBRASAV-WHITE-46','https://www.ikea.com/kr/ko/cat/pendants-18751/',NULL,'EA',NULL,29900,NULL,JSON_OBJECT('color','화이트','diameterCm',46,'room','침실'),1,'2026-08-06 00:00:00',1),
('LIGHTING','GLASS_PENDANT','WHITE','MID','IKEA','JÄRPLIDEN 예르플리덴 펜던트등','JARPLIDEN-WHITE-30','IKEA','JARPLIDEN-WHITE-30','https://www.ikea.com/kr/ko/cat/pendants-18751/',NULL,'EA',NULL,69900,NULL,JSON_OBJECT('material','화이트 유리/니켈 도금','diameterCm',30,'room','식탁/침실'),1,'2026-08-06 00:00:00',1),
('LIGHTING','PENDANT','WHITE','HIGH','IKEA','SKYMNINGEN 쉼닝엔 펜던트등','SKYMNINGEN-WHITE-42','IKEA','SKYMNINGEN-WHITE-42','https://www.ikea.com/kr/ko/cat/pendants-18751/',NULL,'EA',NULL,79900,NULL,JSON_OBJECT('color','화이트','diameterCm',42,'room','거실/식탁'),1,'2026-08-06 00:00:00',1),

('LIGHTING','CERAMIC_PENDANT','MARBLE','LOW','IKEA','SKIVTOFS 시브토프스 펜던트등','SKIVTOFS-OFFWHITE-24','IKEA','SKIVTOFS-OFFWHITE-24','https://www.ikea.com/kr/ko/cat/pendants-18751/',NULL,'EA',NULL,49900,NULL,JSON_OBJECT('material','오프화이트 세라믹','diameterCm',24,'room','주방/식탁'),1,'2026-08-06 00:00:00',1),
('LIGHTING','GLASS_PENDANT','MARBLE','MID','IKEA','MUDDERVERK 무데르베르크 펜던트등','MUDDERVERK-BRASS-OPAL','IKEA','MUDDERVERK-BRASS-OPAL','https://www.ikea.com/kr/ko/cat/pendants-18751/',NULL,'EA',NULL,99900,NULL,JSON_OBJECT('material','황동/오팔 화이트 유리','room','거실/식탁'),1,'2026-08-06 00:00:00',1),
('LIGHTING','GLASS_PENDANT','MARBLE','HIGH','IKEA','STOCKHOLM 2025 스톡홀름 2025 펜던트등','605.859.56','IKEA','60585956','https://www.ikea.com/kr/ko/p/stockholm-2025-pendant-lamp-glass-brass-plated-60585956/',NULL,'EA',NULL,249000,NULL,JSON_OBJECT('material','유리/황동 도금','diameterCm',54,'room','거실/식탁'),1,'2026-08-06 00:00:00',1);

-- The removed feature never had production data in this database (both tables were empty).
-- Keep these drops after the catalog insert so a failed insert cannot remove the legacy tables.
DROP TABLE IF EXISTS material_orders;
DROP TABLE IF EXISTS products;

-- Preserve the dashboard JSON fields for client compatibility, but remove the obsolete role from storage.
ALTER TABLE user_account
    MODIFY COLUMN user_role ENUM('LANDLORD','CONTRACTOR','ADMIN') NOT NULL;
