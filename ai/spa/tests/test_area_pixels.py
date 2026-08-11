import numpy as np

from ai.spa.app.area_pixels import is_included_in_total_area, total_area_pixel_count


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


def test_total_area_pixel_count_excludes_balcony_and_outdoor_equipment_rooms() -> None:
    interior = np.array([[True, True, False]])
    balcony = np.array([[False, False, True]])

    result = total_area_pixel_count(
        [
            {"class_id": 4, "mask": interior},
            {"class_id": 8, "mask": balcony},
            {"class_id": 102, "mask": balcony},
        ]
    )

    assert result == 2
    assert is_included_in_total_area(4) is True
    assert is_included_in_total_area(8) is False
    assert is_included_in_total_area(102) is False
