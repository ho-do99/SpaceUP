package com.spaceup.domain.product.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.spaceup.domain.member.entity.Member;
import com.spaceup.global.entity.BaseTimeEntity;
import com.spaceup.global.error.InsufficientStockException;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// ⭐ PDF "자재 상품 관리 / 자재 등록" 화면. vendor는 domain/member의 MATERIAL_VENDOR 역할 회원입니다.
// Repository/Service/Controller는 product 도메인 개발 착수 시 request/quote와 동일한 패턴으로 추가하면 됩니다.
@Entity
@Table(name = "products")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@lombok.AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Product extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "vendor_id", nullable = false)
	private Member vendor; // 자재업체 (role = MATERIAL_VENDOR)

	@Column(name = "product_code", unique = true, length = 30)
	private String productCode; // 예: STX-600-DX

	@Column(nullable = false, length = 100)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private ProductCategory category;

	@Column(length = 50)
	private String spec; // 규격 (예: 600x600x10T)

	@Column(length = 30)
	private String color;

	@Column(name = "supply_price")
	private Long supplyPrice; // 공급가

	@Column(name = "sale_price")
	private Long salePrice; // 판매가

	@Column(name = "min_order_qty")
	private Integer minOrderQty; // 최소 주문 수량

	@Column(name = "stock_qty")
	private Integer stockQty; // 현재 재고

	@Column(length = 50)
	private String manufacturer;

	@Column(length = 30)
	private String brand;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private ProductStatus status;

	// ⭐ [최종 검토 반영] 기존에는 delta가 재고보다 커도 그대로 차감되어 stockQty가 음수가 될 수 있었습니다.
	// 이제 차감 후 값이 음수가 되면 InsufficientStockException을 던져 오버셀을 막습니다.
	public void updateStock(int delta) {
		int newQty = this.stockQty + delta;
		if (newQty < 0) {
			throw new InsufficientStockException(
					String.format("재고가 부족합니다. 현재 재고: %d, 요청 수량: %d", this.stockQty, -delta));
		}
		this.stockQty = newQty;
		if (this.stockQty == 0) {
			this.status = ProductStatus.SOLD_OUT;
		} else if (this.status == ProductStatus.SOLD_OUT) {
			this.status = ProductStatus.ON_SALE; // 재입고되면 다시 판매중으로
		}
	}

	// ⭐ PDF "자재 등록/수정" 화면에서 기존 상품을 수정할 때 사용
	public void updateInfo(String name, String spec, String color, Long supplyPrice, Long salePrice,
			Integer minOrderQty, String manufacturer, String brand) {
		this.name = name;
		this.spec = spec;
		this.color = color;
		this.supplyPrice = supplyPrice;
		this.salePrice = salePrice;
		this.minOrderQty = minOrderQty;
		this.manufacturer = manufacturer;
		this.brand = brand;
	}

	public void changeStatus(ProductStatus status) {
		this.status = status;
	}

	// ⭐ DB가 부여한 auto-increment id를 이용해 코드를 나중에 붙일 때 사용 (ProductService 참고)
	public void assignCode(String productCode) {
		this.productCode = productCode;
	}
}
