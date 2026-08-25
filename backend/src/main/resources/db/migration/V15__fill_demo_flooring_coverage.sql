-- The source catalog exposes these flooring products by BOX price but does not
-- provide package coverage. For the demo estimate flow, use the same domestic
-- flooring convention already used by the LOW tier products: 1 BOX = 3.3 m2.
-- Only fill missing values so verified coverage added later is never overwritten.
UPDATE material_product
SET coverage_per_unit_m2 = 3.300,
    normalized_price_m2 = ROUND(current_price / 3.300, 2)
WHERE product_id IN (74, 75, 77, 78, 80, 81, 83, 84)
  AND work_type = 'FLOORING'
  AND sale_unit = 'BOX'
  AND coverage_per_unit_m2 IS NULL
  AND normalized_price_m2 IS NULL;
