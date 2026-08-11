import numpy as np

from ai.spa.app.area_pixels import total_area_pixel_count


def test_total_area_pixel_count_uses_mask_union() -> None:
    living_room = np.array(
        [
            [True, True, False],
            [True, True, False],
        ]
    )
    bedroom = np.array(
        [
            [False, True, True],
            [False, False, True],
        ]
    )

    result = total_area_pixel_count(
        [
            {"class_id": 4, "mask": living_room},
            {"class_id": 5, "mask": bedroom},
        ]
    )

    assert result == 6


def test_total_area_pixel_count_returns_zero_without_room_masks() -> None:
    assert total_area_pixel_count([]) == 0
