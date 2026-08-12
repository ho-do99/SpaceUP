package com.spaceup.domain.rental.entity;

import java.math.BigDecimal;
import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.spaceup.global.entity.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
		name = "rental_transaction",
		uniqueConstraints = @UniqueConstraint(
				name = "uk_rental_transaction_source_key",
				columnNames = "source_key"),
		indexes = @Index(
				name = "idx_rental_transaction_region_month",
				columnList = "sgg_code, deal_year, deal_month"))
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class RentalTransaction extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "rental_transaction_id")
	private Long id;

	@Column(name = "apartment_name", length = 200)
	private String apartmentName;

	@Column(name = "apartment_sequence", length = 50)
	private String apartmentSequence;

	@Column(name = "build_year")
	private Integer buildYear;

	@Column(name = "contract_term", length = 30)
	private String contractTerm;

	@Column(name = "contract_type", length = 30)
	private String contractType;

	@Column(name = "deal_day")
	private Integer dealDay;

	@Column(name = "deal_month")
	private Integer dealMonth;

	@Column(name = "deal_year")
	private Integer dealYear;

	@Column(name = "deposit")
	private Long deposit;

	@Column(name = "exclusive_use_area", precision = 10, scale = 4)
	private BigDecimal exclusiveUseArea;

	@Column(name = "floor")
	private Integer floor;

	@Column(name = "jibun", length = 50)
	private String jibun;

	@Column(name = "monthly_rent")
	private Long monthlyRent;

	@Column(name = "previous_deposit")
	private Long previousDeposit;

	@Column(name = "previous_monthly_rent")
	private Long previousMonthlyRent;

	@Column(name = "road_name", length = 200)
	private String roadName;

	@Column(name = "road_name_basement_code", length = 10)
	private String roadNameBasementCode;

	@Column(name = "road_name_main_number", length = 20)
	private String roadNameMainNumber;

	@Column(name = "road_name_sub_number", length = 20)
	private String roadNameSubNumber;

	@Column(name = "road_name_code", length = 30)
	private String roadNameCode;

	@Column(name = "road_name_sequence", length = 20)
	private String roadNameSequence;

	@Column(name = "road_name_sgg_code", length = 10)
	private String roadNameSggCode;

	@Column(name = "sgg_code", length = 5)
	private String sggCode;

	@Column(name = "umd_name", length = 100)
	private String umdName;

	@Column(name = "renewal_request_right_used", length = 30)
	private String renewalRequestRightUsed;

	@Column(name = "source_key", nullable = false, length = 64, columnDefinition = "char(64)")
	private String sourceKey;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "raw_payload", nullable = false, columnDefinition = "json")
	private Map<String, String> rawPayload;
}
