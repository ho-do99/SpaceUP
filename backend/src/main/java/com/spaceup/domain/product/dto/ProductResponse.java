package com.spaceup.domain.product.dto;

import com.spaceup.domain.product.entity.Product;
import com.spaceup.domain.product.entity.ProductCategory;
import com.spaceup.domain.product.entity.ProductStatus;

import lombok.Getter;

@Getter
public class ProductResponse {
	private final Long id;
	private final Long vendorId;
	private final String productCode;
	private final String name;
	private final ProductCategory category;
	private final String spec;
	private final String color;
	private final Long supplyPrice;
	private final Long salePrice;
	private final Integer minOrderQty;
	private final Integer stockQty;
	private final String manufacturer;
	private final String brand;
	private final ProductStatus status;

	public ProductResponse(Product product) {
		this.id = product.getId();
		this.vendorId = product.getVendor().getId();
		this.productCode = product.getProductCode();
		this.name = product.getName();
		this.category = product.getCategory();
		this.spec = product.getSpec();
		this.color = product.getColor();
		this.supplyPrice = product.getSupplyPrice();
		this.salePrice = product.getSalePrice();
		this.minOrderQty = product.getMinOrderQty();
		this.stockQty = product.getStockQty();
		this.manufacturer = product.getManufacturer();
		this.brand = product.getBrand();
		this.status = product.getStatus();
	}
}
