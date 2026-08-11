from __future__ import annotations

from typing import Any

import numpy as np


EXCLUSIVE_AREA_EXCLUDED_CLASS_IDS = frozenset({8, 102})


def is_included_in_total_area(class_id: int) -> bool:
    return class_id not in EXCLUSIVE_AREA_EXCLUDED_CLASS_IDS


def total_area_pixel_count(instances: list[dict[str, Any]]) -> int:
    masks = [
        np.asarray(instance["mask"], dtype=bool)
        for instance in instances
        if "mask" in instance and is_included_in_total_area(int(instance.get("class_id", 0)))
    ]
    if not masks:
        return 0

    combined = np.logical_or.reduce(masks)
    return int(combined.sum())
