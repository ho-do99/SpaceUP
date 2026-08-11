from __future__ import annotations

from typing import Any

import numpy as np


def total_area_pixel_count(instances: list[dict[str, Any]]) -> int:
    masks = [np.asarray(instance["mask"], dtype=bool) for instance in instances if "mask" in instance]
    if not masks:
        return 0

    combined = np.logical_or.reduce(masks)
    return int(combined.sum())
