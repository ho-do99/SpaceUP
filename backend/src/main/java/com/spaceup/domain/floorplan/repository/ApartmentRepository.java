package com.spaceup.domain.floorplan.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.spaceup.domain.floorplan.entity.Apartment;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, Long> {

	// ⭐ [프론트 연동] "아파트/평면도 검색" - 키워드(이름/주소)·지역·면적범위·방개수를 모두 선택적으로 필터링
	@Query("""
			select distinct a from Apartment a join a.variants v
			where (:keyword is null or a.name like concat('%', :keyword, '%')
				or a.roadAddress like concat('%', :keyword, '%')
				or a.lotAddress like concat('%', :keyword, '%'))
			and (:region is null or a.region = :region)
			and (:minAreaM2 is null or v.exclusiveAreaM2 >= :minAreaM2)
			and (:maxAreaM2 is null or v.exclusiveAreaM2 <= :maxAreaM2)
			and (:roomCount is null or v.roomCount = :roomCount)
			""")
	Page<Apartment> search(@Param("keyword") String keyword, @Param("region") String region,
			@Param("minAreaM2") Double minAreaM2, @Param("maxAreaM2") Double maxAreaM2,
			@Param("roomCount") Integer roomCount, Pageable pageable);
}
