package com.spaceup.domain.material.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spaceup.domain.material.dto.MaterialProductResponse;
import com.spaceup.domain.material.entity.MaterialProduct;
import com.spaceup.domain.material.entity.MaterialTheme;
import com.spaceup.domain.material.entity.MaterialWorkType;
import com.spaceup.domain.material.repository.MaterialProductRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaterialCatalogService {
	private final MaterialProductRepository materialProductRepository;

	public List<MaterialProductResponse> getProducts(MaterialTheme theme, MaterialWorkType workType) {
		List<MaterialProduct> products;
		if (theme != null && workType != null) {
			products = materialProductRepository
					.findByThemeAndWorkTypeAndActiveTrueOrderByCurrentPriceAsc(theme, workType);
		} else if (theme != null) {
			products = materialProductRepository.findByThemeAndActiveTrueOrderByWorkTypeAscCurrentPriceAsc(theme);
		} else if (workType != null) {
			products = materialProductRepository.findByWorkTypeAndActiveTrueOrderByThemeAscCurrentPriceAsc(workType);
		} else {
			products = materialProductRepository.findByActiveTrueOrderByThemeAscWorkTypeAscCurrentPriceAsc();
		}
		return products.stream().map(MaterialProductResponse::from).toList();
	}
}
