package com.spaceup.domain.material.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.spaceup.domain.material.entity.MaterialProduct;
import com.spaceup.domain.material.entity.MaterialTheme;
import com.spaceup.domain.material.entity.MaterialWorkType;

public interface MaterialProductRepository extends JpaRepository<MaterialProduct, Long> {
	List<MaterialProduct> findByThemeAndWorkTypeAndActiveTrueOrderByCurrentPriceAsc(
			MaterialTheme theme, MaterialWorkType workType);
	List<MaterialProduct> findByThemeAndWorkTypeAndActiveTrueOrderByCurrentPriceAsc(
			MaterialTheme theme, MaterialWorkType workType, Pageable pageable);
	List<MaterialProduct> findByThemeAndActiveTrueOrderByWorkTypeAscCurrentPriceAsc(MaterialTheme theme);
	List<MaterialProduct> findByWorkTypeAndActiveTrueOrderByThemeAscCurrentPriceAsc(MaterialWorkType workType);
	List<MaterialProduct> findByActiveTrueOrderByThemeAscWorkTypeAscCurrentPriceAsc();
}
