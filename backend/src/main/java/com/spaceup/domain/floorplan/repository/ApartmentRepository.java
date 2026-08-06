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

	// ⭐ [버그 수정] 원래 inner join이라 평면도(variant)가 아직 하나도 없는 아파트는 필터를 전혀 안 걸어도
	// 검색 결과에서 통째로 빠졌습니다(관리자가 아파트만 등록하고 평면도를 아직 안 넣은 정상적인 중간 상태인데도).
	// left join으로 바꿔서 그런 아파트도 목록엔 나오게 하고, 면적/방개수처럼 variant 값이 있어야 의미있는
	// 필터는 파라미터가 null일 때만 v가 null이어도 통과하도록 그대로 둡니다(면적 필터를 실제로 걸면 당연히
	// 평면도가 있는 아파트만 걸러집니다).
	@Query("""
			select distinct a from Apartment a left join a.variants v
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
