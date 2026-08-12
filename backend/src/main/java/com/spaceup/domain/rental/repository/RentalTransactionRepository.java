package com.spaceup.domain.rental.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.spaceup.domain.rental.entity.RentalTransaction;

public interface RentalTransactionRepository extends JpaRepository<RentalTransaction, Long> {

	boolean existsBySourceKey(String sourceKey);

	Page<RentalTransaction> findBySggCodeAndDealYearAndDealMonth(
			String sggCode,
			Integer dealYear,
			Integer dealMonth,
			Pageable pageable);

	// ⭐ [아파트 검색] 지역코드/키워드로 실거래 원본을 최신순으로 전부 가져옵니다. 여기엔 같은 아파트가
	// 거래 건수만큼 중복으로 들어있으니, 서비스 레이어에서 (아파트명+전용면적) 기준으로 중복 제거합니다.
	@Query("""
			SELECT t FROM RentalTransaction t
			WHERE (:sggCode IS NULL OR t.sggCode = :sggCode)
			AND (:keyword IS NULL
				OR t.apartmentName LIKE CONCAT('%', :keyword, '%')
				OR t.roadName LIKE CONCAT('%', :keyword, '%')
				OR t.jibun LIKE CONCAT('%', :keyword, '%')
				OR t.umdName LIKE CONCAT('%', :keyword, '%'))
			ORDER BY t.dealYear DESC, t.dealMonth DESC, t.dealDay DESC
			""")
	List<RentalTransaction> searchForApartments(@Param("sggCode") String sggCode, @Param("keyword") String keyword);
}
